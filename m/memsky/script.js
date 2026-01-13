(() => {
  const API = "https://bsky.social/xrpc/";
  const SESSION_KEY = "bskySession";
  const READ_POSTS_KEY = "readPostURIs";
  const PRIORITIZE_UNREAD_KEY = "prioritizeUnread";
  const LOAD_OLDER_POSTS_KEY = "loadOlderPosts";
  const MUTED_WORDS_KEY = "mutedWords";
  const CONSIDER_ALL_POSTS_AFTER_FIRST_PAGE_AS_READ_BEFORE_DATE_KEY = "considerAllPostsAfterFirstPageAsReadBeforeDate";
  const MAX_READ_POSTS = 2000;
  const SHOW_COPY_JSON_BUTTON = true;
  const DEBUG_LOGS = false;

  function log(...args) {
    if (DEBUG_LOGS) {
      console.log(...args);
    }
  }

  const loginForm = document.getElementById("loginForm");
  const timelineEl = document.getElementById("timeline");
  const statusEl = document.getElementById("status");
  const prioritizeUnreadCheckbox = document.getElementById("prioritizeUnread");
  const loadOlderPostsCheckbox = document.getElementById("loadOlderPosts");
  const mutedWordsTextarea = document.getElementById("mutedWords");
  const timelineControlsEl = document.getElementById("timelineControls");
  const refreshButton = document.getElementById("refreshButton");
  const unreadCountOverlay = document.getElementById("unread-count-overlay");
  const readPostsSettings = document.getElementById("read-posts-settings");
  const resetReadPostsButton = document.getElementById("resetReadPosts");
  const rememberingCountEl = document.getElementById("remembering-count");
  const logoutButton = document.getElementById("logout");

  let accessToken = null;
  let cursor = null;
  let loading = false;
  let prioritizeUnread = true;
  let loadOlderPosts = false;
  let lastRefreshTime = null;
  let readPostURIs = [];
  let mutedWords = [];
  let timelinePosts = [];
  let postObserver = null;

  function setStatus(msg) {
    statusEl.textContent = msg || "";
  }

  function saveSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function loadSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
      return null;
    }
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    accessToken = null;
  }

  async function refreshSession() {
    const session = loadSession();
    if (!session?.refreshJwt) {
      clearSession();
      return;
    }

    const res = await fetch(API + "com.atproto.server.refreshSession", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + session.refreshJwt
      },
    });

    if (!res.ok) {
      clearSession();
      return;
    }

    const newSession = await res.json();
    saveSession(newSession);
    accessToken = newSession.accessJwt;
  }

  function loadReadPostURIs() {
    try {
      const uris = JSON.parse(localStorage.getItem(READ_POSTS_KEY));
      return Array.isArray(uris) ? uris : [];
    } catch {
      return [];
    }
  }

  function saveReadPostURIs() {
    localStorage.setItem(READ_POSTS_KEY, JSON.stringify(readPostURIs));
    updateRememberingCount();
  }

  function loadMutedWords() {
    const mutedWordsString = localStorage.getItem(MUTED_WORDS_KEY) || "";
    mutedWordsTextarea.value = mutedWordsString;
    mutedWords = mutedWordsString.split('\n').filter(w => w.trim() !== '');
  }

  function saveMutedWords() {
    const mutedWordsString = mutedWordsTextarea.value;
    localStorage.setItem(MUTED_WORDS_KEY, mutedWordsString);
    mutedWords = mutedWordsString.split('\n').filter(w => w.trim() !== '');
  }

  function isMuted(postItem) {
    let allText = '';
    if (postItem?.post?.record?.text) {
      allText += postItem.post.record.text;
    }

    if (postItem?.post?.embed) {
      const embed = postItem.post.embed;
      if (embed.$type === 'app.bsky.embed.record#view' && embed.record?.record?.text) {
        allText += ' ' + embed.record.record.text;
      } else if (embed.$type === 'app.bsky.embed.recordWithMedia#view' && embed.record?.record?.text) {
        allText += ' ' + embed.record.record.text;
      } else if (embed.$type === 'app.bsky.embed.recordWithMedia#view' && embed.record?.record?.value?.text) {
        // This case is for quoted posts that are actually records, like a post from a different app
        allText += ' ' + embed.record.record.value.text;
      }
    }

    if (!allText) return false;

    for (const word of mutedWords) {
      const isCaseSensitive = /[A-Z]/.test(word);
      if (isCaseSensitive) {
        if (allText.includes(word)) return true;
      } else {
        if (allText.toLowerCase().includes(word.toLowerCase())) return true;
      }
    }
    return false;
  }

  function addReadPostURI(uri, reason) {
    if (readPostURIs.includes(uri)) return false;
    log("addReadPostURI due to " + reason);
    readPostURIs.push(uri);
    if (readPostURIs.length > MAX_READ_POSTS) {
      readPostURIs = readPostURIs.slice(readPostURIs.length - MAX_READ_POSTS);
    }
    saveReadPostURIs();
    updateUnreadCount();
    return true;
  }

  function updateRememberingCount() {
    rememberingCountEl.textContent = `Remembering ${readPostURIs.length} read posts`;
  }

  function updateUnreadCountOverlayVisibility() {
    if (prioritizeUnread && readPostURIs.length > 0) {
      if (window.scrollY > 0) {
        unreadCountOverlay.style.bottom = "calc(10px + env(safe-area-inset-bottom))";
      } else {
        unreadCountOverlay.style.bottom = "-100px";
      }
    } else {
      unreadCountOverlay.style.bottom = "-100px";
    }
  }

  function updateUnreadCount() {
    if (!prioritizeUnread) return;

    const unreadCount = timelinePosts.filter(item => item.post && !readPostURIs.includes(item.post.uri)).length;
    unreadCountOverlay.textContent = `${unreadCount} unread (${timelinePosts.length} total)`;
  }

  function initIntersectionObserver() {
    if (postObserver) postObserver.disconnect();

    postObserver = new IntersectionObserver((entries) => {
      // User input is blocked starting when we request new posts
      // until auto-scroll can put all unread posts above the unread line.
      // Don't mark any posts as read until we return scrolling control
      // to the user.
      if (userInputBlocker) return;

      let topMostReadPost = null;

      entries.forEach(entry => {
        if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
          // Scrolled off the top of the screen
        } else if (!entry.isIntersecting && entry.boundingClientRect.top > 0) {
          // Scrolled off the bottom of the screen, mark as read
          const postUri = entry.target.id;
          if (postUri) {
            const isNewRead = addReadPostURI(postUri, "scroll");
            if (isNewRead) {
              if (!topMostReadPost || entry.target.offsetTop < topMostReadPost.offsetTop) {
                topMostReadPost = entry.target;
              }
            }
          }
        }
      });

      if (topMostReadPost) {
        const dividerEl = document.getElementById('unread-divider');
        if (dividerEl) {
          log("Inserting divider before topMostReadPost");
          timelineEl.insertBefore(dividerEl, topMostReadPost);
        }
      }
    }, {
      root: null,
      rootMargin: "0px 0px 0px 0px",
      threshold: 0
    });
  }

  function renderVideo(embed, post) {
    const div = document.createElement("div");
    div.className = "video";
    if (embed.aspectRatio) {
      div.style.aspectRatio = `${embed.aspectRatio.width} / ${embed.aspectRatio.height}`;
    }

    const video = document.createElement("video");
    video.src = embed.playlist;
    video.poster = embed.thumbnail;
    video.controls = true;
    video.muted = true;
    video.playsinline = true;
    div.appendChild(video);

    return div;
  }

  function renderImages(embed, post) {
    if (!embed?.images) return null;

    const div = document.createElement("div");
    div.className = "images";

    embed.images.forEach(img => {
      const a = document.createElement("a");
      a.href = img.fullsize;
      a.target = "_blank";

      const el = document.createElement("img");
      el.src = img.thumb;
      el.alt = img.alt;
      el.loading = "lazy";
      if (img.aspectRatio) {
        el.style.aspectRatio = `${img.aspectRatio.width} / ${img.aspectRatio.height}`;
      }
      a.appendChild(el);
      div.appendChild(a);
    });

    return div;
  }

  function renderExternal(embed, post) {
    if (!embed?.external) return null;

    const wrap = document.createElement("a");
    wrap.className = "external";
    wrap.href = embed.external.uri;
    wrap.target = "_blank";

    if (embed.external.thumb) {
      const img = document.createElement("img");
      img.src = embed.external.thumb;
      wrap.appendChild(img);
    }

    const info = document.createElement("div");
    info.className = "info";
    info.innerHTML = `
      <div><strong>${embed.external.title || ""}</strong></div>
      <div>${embed.external.description || ""}</div>
      <small>${embed.external.uri}</small>
    `;
    wrap.appendChild(info);

    return wrap;
  }

  function processFacets(text, facets) {
    if (!facets || facets.length === 0) {
      return text;
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const textBytes = encoder.encode(text);

    let html = "";
    let lastIndex = 0;

    facets.forEach(facet => {
      const { byteStart, byteEnd } = facet.index;
      const feature = facet.features[0]; // Assuming one feature per facet for now

      if (feature && feature.$type === "app.bsky.richtext.facet#link") {
        html += decoder.decode(textBytes.slice(lastIndex, byteStart));
        const linkText = decoder.decode(textBytes.slice(byteStart, byteEnd));
        html += `<a href="${feature.uri}" target="_blank">${linkText}</a>`;
        lastIndex = byteEnd;
      }
      // Optional future enhancement: Handle other facet types like mentions or tags
    });

    html += decoder.decode(textBytes.slice(lastIndex));
    return html;
  }

  function renderQuotedPost(post) {
    const div = document.createElement("div");
    div.className = "quoted-post";

    const authorInfo = post.author || post.creator;
    if (!authorInfo) return div; // Can't render a post without an author

    const author = document.createElement("div");
    author.className = "author";
    author.innerHTML = `
      <img class="avatar" src="${authorInfo.avatar}" loading="lazy">
      <div>
        ${authorInfo.displayName || "Unnamed"}
        <span class="handle">@${authorInfo.handle}</span>
      </div>
    `;
    div.appendChild(author);

    const text = document.createElement("div");
    text.className = "text";
    text.innerHTML = processFacets(post.value?.text ?? post.description ?? '', post.value?.facets);
    div.appendChild(text);

    if (post.embeds) {
      post.embeds.forEach(embed => {
        if (embed.$type === 'app.bsky.embed.images#view') {
          const images = renderImages(embed, post);
          if (images) div.appendChild(images);
        } else if (embed.$type === 'app.bsky.embed.recordWithMedia#view') {
          const images = renderImages(embed.media, post);
          if (images) div.appendChild(images);
        }
      });
    }

    return div;
  }

  function renderPost_safe(item) {
    try {
      return renderPost(item);
    } catch (e) {
      console.log("Caught exception: " + e);
      console.log("Failed to render:\n" + JSON.stringify(item, null, 2));

      const errorDiv = document.createElement("div");
      errorDiv.className = "post-error";

      const errorMessage = document.createElement("div");
      errorMessage.textContent = "Failed to render post.";
      errorDiv.appendChild(errorMessage);

      const copyButton = document.createElement("button");
      copyButton.textContent = "Copy JSON";
      copyButton.onclick = (event) => {
        if (event) {
          event.preventDefault();
        }
        navigator.clipboard.writeText(JSON.stringify(item, null, 2));
        const origText = copyButton.textContent;
        copyButton.textContent = "Copied!";
        setTimeout(() => {
          copyButton.textContent = origText;
        }, 800);
      };
      errorDiv.appendChild(copyButton);

      return errorDiv;
    }
  }

  function renderPost(item) {
    let post = item.post;
    if (!post?.record) return null;

    const div = document.createElement("div");
    div.className = "post";
    div.id = post.uri;

    if (item.reason) {
      const repost = document.createElement("div");
      repost.className = "repost";
      repost.innerHTML = `
        Reposted by ${item.reason.by.displayName}
        <span class="handle">@${item.reason.by.handle}</span>
      `;
      div.appendChild(repost);
    }

    const main = document.createElement("div");
    if (item.reply) {
      const replyIndicator = document.createElement("div");
      replyIndicator.className = "reply-indicator";
      if (item.reply.parent.author) {
        const replyToHandle = item.reply.parent.author.handle;
        const replyToDisplayName = item.reply.parent.author.displayName;
        replyIndicator.textContent = `Replying to ${replyToDisplayName || ''} @${replyToHandle}`;
      } else {
        replyIndicator.textContent = "Replying to a post";
      }
      main.appendChild(replyIndicator);
    }
    const content = document.createElement("div");
    content.innerHTML = `
      <div class="author">
        <img class="avatar" src="${post.author.avatar}" loading="lazy">
        <div>
          ${post.author.displayName || "Unnamed"}
          <span class="handle">@${post.author.handle}</span>
        </div>
      </div>
      <div class="text">${processFacets(post.record.text ?? '', post.record.facets)}</div>
    `;
    main.appendChild(content);
    div.appendChild(main);

    if (post.embed) {
      if (post.embed.$type === 'app.bsky.embed.images#view' || post.embed.$type === 'app.bsky.embed.images') {
        const images = renderImages(post.embed, post);
        if (images) main.appendChild(images);
      } else if (post.embed.$type === 'app.bsky.embed.external#view' || post.embed.$type === 'app.bsky.embed.external') {
        const external = renderExternal(post.embed, post);
        if (external) main.appendChild(external);
      } else if (post.embed.$type === 'app.bsky.embed.record#view') {
        const quotedPost = renderQuotedPost(post.embed.record);
        if (quotedPost) main.appendChild(quotedPost);
      } else if (post.embed.$type === 'app.bsky.embed.recordWithMedia#view') {
        if (post.embed.media) {
          const images = renderImages(post.embed.media, post);
          if (images) main.appendChild(images);
        }
        if (post.embed.record) {
          const quotedPost = renderQuotedPost(post.embed.record.record);
          if (quotedPost) main.appendChild(quotedPost);
        }
      } else if (post.embed.$type === 'app.bsky.embed.video#view') {
        const video = renderVideo(post.embed, post);
        if (video) main.appendChild(video);
      }
    }


    const meta = document.createElement("div");
    meta.className = "meta";
    const rkey = post.uri.split('/').pop();
    const bskyPostUrl = `https://bsky.app/profile/${post.author.handle}/post/${rkey}`;
    meta.innerHTML = `<a href="${bskyPostUrl}" target="_blank">${new Date(post.indexedAt).toLocaleString().toLowerCase()}</a>`;
    main.appendChild(meta);

    if (SHOW_COPY_JSON_BUTTON) {
      const copyLink = document.createElement("a");
      copyLink.className = "copyJsonLink";
      copyLink.textContent = "json";
      copyLink.href = '';
      copyLink.onclick = (event) => {
        if (event) {
          event.preventDefault();
        }
        navigator.clipboard.writeText(JSON.stringify(item, null, 2));
        const origText = copyLink.textContent;
        copyLink.textContent = "copied!";
        setTimeout(() => {
          copyLink.textContent = origText;
        }, 800);
      }
      meta.appendChild(copyLink);
    }

    return div;
  }

  // Usage:
  // const rect = el.getBoundingClientRect();
  // const initialVVTop = window.visualViewport?.offsetTop || 0;
  // const targetTopVisualPosition = rect.top - initialVVTop;
  // pinElementToVisualTop({
  //   element: el,
  //   targetTopVisualPosition,
  //   initialVisualViewportOffsetTop,
  //   onComplete: reason => {
  //     log("Pin finished:", reason);
  //   }
  // });
  function pinElementToVisualTop({
    element,
    targetTopVisualPosition,
    initialVisualViewportOffsetTop,
    maxFrames = 20,
    tolerance = 1,
    onComplete
  }) {
    //log(`pinElementToVisualTop: el ${element} targetTopVisualPosition ${targetTopVisualPosition} initialVVOT ${initialVisualViewportOffsetTop}`)
    let frame = 0;
    let done = false;

    function finish(reason) {
      if (done) return;
      done = true;
      if (typeof onComplete === "function") {
        onComplete(reason);
      }
    }

    function step() {
      frame++;

      const rect = element.getBoundingClientRect();
      const currentVVTop = window.visualViewport?.offsetTop || 0;

      // How far the visual viewport has shifted since pairing
      const viewportDelta =
        currentVVTop - initialVisualViewportOffsetTop;

      // Where the element SHOULD be relative to layout viewport
      const desiredLayoutTop =
        targetTopVisualPosition + viewportDelta;

      const error = rect.top - desiredLayoutTop;

      //log("Error: " + error);
      if (Math.abs(error) > tolerance) {
        window.scrollBy({ top: error, behavior: "auto" });
      }

      if (Math.abs(error) <= tolerance) {
        finish("settled");
        return;
      }

      if (frame >= maxFrames) {
        finish("maxFrames");
        return;
      }

      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  let dividerPinInterval = null;
  let lastDividerTop = 0;
  let lastScrollY = 0;

  function renderTimelineWithReadUnread(firstPostTop, visualViewportOffsetTop) {
    if (dividerPinInterval) clearInterval(dividerPinInterval);

    const unreadPosts = [];
    const readPosts = [];

    timelinePosts.forEach(item => {
      if (item.post && readPostURIs.includes(item.post.uri)) {
        readPosts.push(item);
      } else {
        unreadPosts.push(item);
      }
    });

    timelineEl.innerHTML = "";
    if (postObserver) postObserver.disconnect();

    unreadPosts.forEach(item => {
      const postEl = renderPost_safe(item);
      if (postEl) {
        timelineEl.appendChild(postEl);
        if (postObserver) postObserver.observe(postEl);
      }
    });

    const dividerEl = document.getElementById('dividerTemplate').firstElementChild.cloneNode(true);
    if (unreadPosts.length === 0) {
      let text = "no unread posts";
      if (lastRefreshTime) {
        text += ` - updated at ${lastRefreshTime.toLocaleTimeString().toLowerCase()}`;
      }
      dividerEl.querySelector('.divider-text').textContent = text;
    }
    timelineEl.appendChild(dividerEl);


    let firstReadPostEl = null;

    readPosts.forEach(item => {
      const postEl = renderPost_safe(item);
      if (postEl) {
        if (!firstReadPostEl) {
          firstReadPostEl = postEl;
        }
        timelineEl.appendChild(postEl);
        if (postObserver) postObserver.observe(postEl);
      }
    });

    updateUnreadCount();

    log("Evaluating new post rendering layout stability");

    let lastHeight = 0;
    let stableCount = 0;
    const interval = setInterval(() => {
      const currentHeight = timelineEl.scrollHeight;
      if (currentHeight === lastHeight) {
        stableCount++;
      } else {
        stableCount = 0;
      }
      lastHeight = currentHeight;

      if (stableCount >= 6) {
        clearInterval(interval);

        if (unreadPosts.length === 0) {
          window.scrollTo(0, 0);
          unblockInput();
        } else if (dividerEl) {

          const pinDividerToStablePositionUntilUserScrolls = () => {
            setTimeout(() => {
              lastDividerTop = dividerEl.getBoundingClientRect().top;
              lastScrollY = window.scrollY;

              dividerPinInterval = setInterval(() => {
                if (!document.contains(dividerEl)) {
                  clearInterval(dividerPinInterval);
                  return;
                }

                const currentScrollY = window.scrollY;
                if (Math.abs(currentScrollY - lastScrollY) > 1) {
                  // User scrolled, so update our baseline
                  lastScrollY = currentScrollY;
                  lastDividerTop = dividerEl.getBoundingClientRect().top;
                } else {
                  // Scroll hasn't changed, so any movement is a layout shift
                  const newTop = dividerEl.getBoundingClientRect().top;
                  const delta = newTop - lastDividerTop;

                  if (Math.abs(delta) > 1) {
                    window.scrollBy(0, delta);
                  }
                }

                log("Pinning - dividerTop: " + dividerEl.getBoundingClientRect().top)

                if (dividerEl.getBoundingClientRect().top < -100 || dividerEl.getBoundingClientRect().top > window.innerHeight + 100) {
                  clearInterval(dividerPinInterval);
                }

              }, 100);

            }, 100);
          }


          if (typeof firstPostTop === 'number') {
            pinElementToVisualTop({
              element: firstReadPostEl,
              targetTopVisualPosition: firstPostTop,
              initialVisualViewportOffsetTop: visualViewportOffsetTop,
              maxFrames: 20,
              tolerance: 1,
              onComplete: reason => {
                log("Pin finished:", reason);

                pinDividerToStablePositionUntilUserScrolls();

                // Remove snapshot and give control back to the user
                // after another short delay to let the page stabilize
                setTimeout(() => {
                  unblockInput();
                }, 100);
              }
            });
          } else {
            window.scrollTo(0, dividerEl.offsetTop - (window.innerHeight * 0.75));
            unblockInput();
          }
        } else {
          if (unreadPosts.length > 0) {
            // This shouldn't happen
            log("No unread indicator showing");
            window.scrollTo(0, 0);
          }
          unblockInput();
        }
      }
    }, 100);
  }

  function renderTimelineWithPrioritizedUnreadAndPreservedOrder(postOrder, firstPostTop, visualViewportOffsetTop) {
    if (dividerPinInterval) clearInterval(dividerPinInterval);

    const knownUris = new Set(Object.keys(postOrder));
    const newUnreadPosts = [];
    const newReadPosts = [];
    const knownPosts = [];

    timelinePosts.forEach(item => {
      if (!item.post) return;
      const uri = item.post.uri;
      if (knownUris.has(uri)) {
        knownPosts.push(item);
      } else if (readPostURIs.includes(uri)) {
        newReadPosts.push(item);
      } else {
        newUnreadPosts.push(item);
      }
    });

    // Sort the known posts based on their original order
    knownPosts.sort((a, b) => postOrder[a.post.uri] - postOrder[b.post.uri]);

    // Combine the lists: new unread, then known, then new read
    const finalPosts = [...newUnreadPosts, ...knownPosts, ...newReadPosts];
    timelinePosts = finalPosts;

    renderTimelineWithReadUnread(firstPostTop, visualViewportOffsetTop);
  }


  async function fetchAndAppend(fetchCursor) {
    let session = loadSession();
    if (!session?.accessJwt) {
      clearSession();
      return null;
    }
    accessToken = session.accessJwt;

    const url = new URL(API + "app.bsky.feed.getTimeline");
    url.searchParams.set("limit", "50");
    if (fetchCursor) url.searchParams.set("cursor", fetchCursor);

    let res = await fetch(url, {
      headers: { Authorization: "Bearer " + accessToken }
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 400) {
        await refreshSession();
        session = loadSession();
        if (!session?.accessJwt) return null;
        accessToken = session.accessJwt;
        res = await fetch(url, {
          headers: { Authorization: "Bearer " + accessToken }
        });

        if (!res.ok) {
          clearSession();
          return null;
        }
      } else {
        clearSession();
        return null;
      }
    }

    const data = await res.json();
    data.feed = data.feed.filter(item => !isMuted(item));
    return data;
  }

  async function fetchOlderPosts() {
    if (loading) return;
    loading = true;

    const data = await fetchAndAppend(cursor);
    if (data) {
      let newPosts = data.feed;
      if (prioritizeUnread && cursor) {
        // If "Load older posts" is checked, we don't filter by date.
        if (!loadOlderPosts) {
          const considerAllPostsAfterFirstPageAsReadBeforeDateString = localStorage.getItem(CONSIDER_ALL_POSTS_AFTER_FIRST_PAGE_AS_READ_BEFORE_DATE_KEY);
          if (considerAllPostsAfterFirstPageAsReadBeforeDateString) {
            const considerAllPostsAfterFirstPageAsReadBeforeDate = new Date(considerAllPostsAfterFirstPageAsReadBeforeDateString);
            newPosts = newPosts.filter(p => {
              const postDate = new Date(p.post.indexedAt);
              return postDate >= considerAllPostsAfterFirstPageAsReadBeforeDate;
            });
          }
        }
      }

      const existingUris = new Set(timelinePosts.map(p => p.post.uri));
      const uniqueNewPosts = newPosts.filter(p => !existingUris.has(p.post.uri));
      timelinePosts.push(...uniqueNewPosts);
      cursor = data.cursor;
    }

    loading = false;
  }

  async function fetchNewerPosts() {
    if (loading) return;
    loading = true;

    const data = await fetchAndAppend(null);
    if (data) {
      const existingUris = new Set(timelinePosts.map(p => p.post.uri));
      const newPosts = data.feed.filter(p => !existingUris.has(p.post.uri));
      timelinePosts.unshift(...newPosts);
    }

    loading = false;
  }

  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    timelineEl.innerHTML = "";
    cursor = null;
    timelinePosts = [];

    let handle = document.getElementById("handle").value.trim();
    if (handle.indexOf(".") === -1) {
      handle += ".bsky.social";
    }
    const password = document.getElementById("password").value;

    setStatus("Logging in…");

    const res = await fetch(API + "com.atproto.server.createSession", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: handle, password })
    });

    if (!res.ok) {
      setStatus("Login failed");
      return;
    }

    const session = await res.json();
    accessToken = session.accessJwt;
    saveSession(session);
    setStatus(""); // Clear "Logging in..." status
    loginForm.style.display = "none";
    logoutButton.style.display = 'block';

    if (prioritizeUnread) {
      readPostURIs = loadReadPostURIs();
      initIntersectionObserver();
      readPostsSettings.style.display = 'block';
      timelineControlsEl.style.display = 'block';
      updateRememberingCount();
      blockInput();
      await fetchOlderPosts();
      renderTimelineWithReadUnread();
    } else {
      timelineControlsEl.style.display = 'none';
      const data = await fetchAndAppend(null);
      if (data) {
        data.feed.forEach(item => {
          const postEl = renderPost_safe(item);
          if (postEl) timelineEl.appendChild(postEl);
        });
        cursor = data.cursor;
      }
    }
  });

  refreshButton.addEventListener("click", async (event) => {
    if (event) event.preventDefault();

    lastRefreshTime = new Date();
    refreshButton.textContent = "Loading...";


    let firstPostEl = null;

    // Store the original order of the posts on the page
    const postOrder = {};
    timelinePosts.forEach((item, index) => {
      if (item.post) {
        if (!firstPostEl) {
          firstPostEl = document.getElementById(item.post.uri);
        }
        postOrder[item.post.uri] = index;
      }
    });


    const visualViewportOffsetTop = window.visualViewport?.offsetTop || 0;

    firstPostEl = firstPostEl ? firstPostEl : timelineEl;
    const firstPostTop = firstPostEl.getBoundingClientRect().top - visualViewportOffsetTop;

    log("First post top: " + firstPostTop);


    blockInput();


    // Mark all currently visible unread posts as read
    timelinePosts.forEach(item => {
      if (item.post && !readPostURIs.includes(item.post.uri)) {
        addReadPostURI(item.post.uri, "refresh clicked");
      }
    });

    await fetchNewerPosts();
    await fetchOlderPosts();

    renderTimelineWithPrioritizedUnreadAndPreservedOrder(postOrder, firstPostTop, visualViewportOffsetTop);
  });

  resetReadPostsButton.addEventListener("click", () => {
    readPostURIs = [];
    localStorage.removeItem(READ_POSTS_KEY);
    localStorage.removeItem(CONSIDER_ALL_POSTS_AFTER_FIRST_PAGE_AS_READ_BEFORE_DATE_KEY);
    updateRememberingCount();
    window.location.reload();
  });

  logoutButton.addEventListener("click", () => {
    if (confirm("Logging out will erase your read post history. This cannot be undone.")) {
      clearSession();
      localStorage.removeItem(READ_POSTS_KEY); // Forget read posts history
      localStorage.removeItem(CONSIDER_ALL_POSTS_AFTER_FIRST_PAGE_AS_READ_BEFORE_DATE_KEY);
      window.location.reload();
    }
  });


  let userInputBlocker = null;
  const stop = e => {
    e.preventDefault();
    e.stopPropagation();
  };

  function blockInput() {
    if (userInputBlocker) { return; }

    const rect = timelineEl.getBoundingClientRect();
    const first = timelineEl.firstElementChild;

    let visualTop = rect.top;

    // Correct for margin collapse (unread divider specifically throws off
    // snapshot positionining if it is the first element)
    if (first) {
      const firstStyle = getComputedStyle(first);
      const marginTop = parseFloat(firstStyle.marginTop) || 0;
      visualTop = rect.top - marginTop;
    }

    const bodyBackgroundColor = getComputedStyle(document.body).backgroundColor;

    const snapshotEl = document.createElement("div");
    snapshotEl.id = "snapshot";
    snapshotEl.style.position = "fixed";
    snapshotEl.style.top = `${visualTop}px`;
    snapshotEl.style.left = `${rect.left}px`;
    snapshotEl.style.width = `${rect.width}px`;
    snapshotEl.style.height = `${rect.height}px`;
    snapshotEl.style.overflow = "hidden";
    snapshotEl.style.zIndex = "2147483646";
    snapshotEl.style.backgroundColor = bodyBackgroundColor;
    snapshotEl.appendChild(timelineEl.cloneNode(true));

    document.body.appendChild(snapshotEl);

    log("block input");
    userInputBlocker = document.createElement("div");
    userInputBlocker.style.position = "fixed";
    userInputBlocker.style.inset = "0";
    userInputBlocker.style.zIndex = "2147483647";
    userInputBlocker.style.background = "transparent";
    userInputBlocker.style.pointerEvents = "all";
    userInputBlocker.style.touchAction = "none";


    document.addEventListener("wheel", stop, { passive: false, capture: true });
    document.addEventListener("keydown", stop, true);


    document.body.appendChild(userInputBlocker);
  }

  function unblockInput() {
    if (userInputBlocker) {
      log("unblock input");
      refreshButton.textContent = "Refresh";

      const snapshotEl = document.getElementById("snapshot");
      if (snapshotEl) {
        snapshotEl.remove();
      }

      document.removeEventListener("wheel", stop, true);
      document.removeEventListener("keydown", stop, true);

      userInputBlocker.remove();
      userInputBlocker = null;
    }
  }


  window.addEventListener("scroll", () => {
    updateUnreadCountOverlayVisibility();

    if (prioritizeUnread) return;

    if (window.innerHeight + window.scrollY > document.body.offsetHeight - 300) {
      (async () => {
        if (loading) return;
        loading = true;

        const data = await fetchAndAppend(cursor);
        if (data) {
          data.feed.forEach(item => {
            const postEl = renderPost_safe(item);
            if (postEl) timelineEl.appendChild(postEl);
          });
          cursor = data.cursor;
        }
        loading = false;
      })();
    }
  });

  prioritizeUnread = localStorage.getItem(PRIORITIZE_UNREAD_KEY) === "false" ? false : true;
  prioritizeUnreadCheckbox.checked = prioritizeUnread;
  updateUnreadCountOverlayVisibility();

  prioritizeUnreadCheckbox.addEventListener("change", () => {
    prioritizeUnread = prioritizeUnreadCheckbox.checked;
    localStorage.setItem(PRIORITIZE_UNREAD_KEY, prioritizeUnread);

    if (accessToken) {
      window.location.reload();
    }
  });

  loadOlderPosts = localStorage.getItem(LOAD_OLDER_POSTS_KEY) === "true";
  loadOlderPostsCheckbox.checked = loadOlderPosts;

  loadOlderPostsCheckbox.addEventListener("change", () => {
    loadOlderPosts = loadOlderPostsCheckbox.checked;
    localStorage.setItem(LOAD_OLDER_POSTS_KEY, loadOlderPosts);
  });

  const session = loadSession();
  if (session?.accessJwt) {
    accessToken = session.accessJwt;
    loginForm.style.display = "none";
    logoutButton.style.display = 'block';

    if (prioritizeUnread) {
      readPostURIs = loadReadPostURIs();
      initIntersectionObserver();
      readPostsSettings.style.display = 'block';
      timelineControlsEl.style.display = 'block';
      updateRememberingCount();
      (async () => {
        blockInput();
        await fetchOlderPosts();
        renderTimelineWithReadUnread();
      })();
    } else {
      readPostsSettings.style.display = 'none';
      timelineControlsEl.style.display = 'none';
      (async () => {
        const data = await fetchAndAppend(null);
        if (data) {
          data.feed.forEach(item => {
            const postEl = renderPost_safe(item);
            if (postEl) timelineEl.appendChild(postEl);
          });
          cursor = data.cursor;
        }
      })();
    }
  }

  const settingsButton = document.getElementById("settings-button");
  const settingsPanel = document.getElementById("settings-panel");
  const closeSettingsButton = document.getElementById("close-settings-button");

  settingsButton.addEventListener("click", () => {
    loadMutedWords();
    settingsPanel.style.display = "flex";
  });

  settingsPanel.addEventListener("click", (e) => {
    if (e.target === settingsPanel) {
      saveMutedWords();
      settingsPanel.style.display = "none";
    }
  });

  closeSettingsButton.addEventListener("click", () => {
    saveMutedWords();
    settingsPanel.style.display = "none";
  });

  {
    const considerAllPostsAfterFirstPageAsReadBeforeDate = localStorage.getItem(CONSIDER_ALL_POSTS_AFTER_FIRST_PAGE_AS_READ_BEFORE_DATE_KEY);
    if (!considerAllPostsAfterFirstPageAsReadBeforeDate) {
      localStorage.setItem(CONSIDER_ALL_POSTS_AFTER_FIRST_PAGE_AS_READ_BEFORE_DATE_KEY, new Date().toISOString());
    }
  }

  loadMutedWords();
})();
