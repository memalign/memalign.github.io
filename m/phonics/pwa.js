// Based on https://github.com/chr15m/minimal-pwa/blob/main/single-file-pwa.html

let PWAIconURL = './cards-1000.png';

const manifest = {
  name: 'Phonics',
  short_name: 'Phonics',
  display: 'standalone',
  theme_color: '#6200EA',
  background_color: '#F4F4F9',
  start_url: window.location.href,
  // icons will be added dynamically
};

window.addEventListener('beforeinstallprompt', (e) => {
  // console.log('Install prompt available!');
});

const iconSizes = [32, 192, 256, 512];

// Generate icons
(async function() {

  manifest.icons = []

  for (const iconSize of iconSizes) {
    const pngDataUrl = await urlToResizedPNG(PWAIconURL, iconSize);

    setAppleTouchIcon(pngDataUrl, iconSize);

    manifest.icons.push({
      src: pngDataUrl,
      sizes: `${iconSize}x${iconSize}`,
      type: 'image/png'
    });
  }

  // set the manifest meta tag data url
  setManifest(manifest);

  // generate and set the iOS startup image
  const startupImageDataUrl = await createStartupImage(
    PWAIconURL,
    manifest.background_color
  );
  const startupLink = document.createElement('link');
  startupLink.rel = 'apple-touch-startup-image';
  startupLink.href = startupImageDataUrl;
  document.head.appendChild(startupLink);
})();

function setManifest(manifest) {
  const link = document.createElement('link');
  link.rel = 'manifest';
  const b64manifest = btoa(JSON.stringify(manifest));
  link.href = "data:application/json;base64," + b64manifest;
  document.head.appendChild(link);
}

function setAppleTouchIcon(iconurl, size) {
  const link = document.createElement('link');
  link.rel = 'apple-touch-icon';
  link.setAttribute('sizes', `${size}x${size}`);
  link.href = iconurl;
  link.type = 'image/png';
  document.head.appendChild(link);
}

function urlToResizedPNG(url, size) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      const pngDataUrl = canvas.toDataURL('image/png');
      resolve(pngDataUrl);
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Safari needs a startup image
function createStartupImage(imgURL, bgColor) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      const canvas = document.createElement('canvas');
      canvas.width = window.screen.width * dpr;
      canvas.height = window.screen.height * dpr;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const iconDisplaySize = canvas.width * 0.25;
      const x = (canvas.width - iconDisplaySize) / 2;
      const y = (canvas.height - iconDisplaySize) / 2;
      ctx.drawImage(img, x, y, iconDisplaySize, iconDisplaySize);

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = imgURL;
  });
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
  .then((reg) => {
    // registration worked
  }).catch((error) => {
    // registration failed
    console.log('Registration failed with ' + error);
  });
}
