document.addEventListener('DOMContentLoaded', () => {
    const gameGrid = document.getElementById('projects-grid');

    const sortedEntries = Object.entries(GameGenerators).sort((a, b) => a[1].displayOrder - b[1].displayOrder);

    for (const [gameId, game] of sortedEntries) {
        const gridEntry = document.createElement('div');
        gridEntry.id = 'projects-grid-entry';

        const gameLink = document.createElement('a');
        gameLink.href = `wolfer.html?g=${gameId}`;

        const title = document.createElement('div');
        title.id = 'projects-grid-title';
        title.textContent = game.name;

        const rectImgContainer = document.createElement('div');
        rectImgContainer.classList.add('rect-img-container');

        const icon = document.createElement('img');

        const iconURL = GameGeneratorIconURLForGameName(gameId);

        icon.src = iconURL;
        icon.alt = `${game.name} icon`;
        rectImgContainer.appendChild(icon);

        gameLink.appendChild(rectImgContainer);
        gameLink.appendChild(title);

        gridEntry.appendChild(gameLink);

        const description = document.createElement('p');
        description.textContent = game.description || '';
        gridEntry.appendChild(description);

        gameGrid.appendChild(gridEntry);
    }
});
