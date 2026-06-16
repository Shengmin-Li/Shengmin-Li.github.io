
const content_dir = 'contents/'
const config_file = 'config.yml'
const news_file = 'news.yml'
const publications_file = 'publications.yml'
const education_file = 'education.yml'

const allowedUrlProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
const configOnlyKeys = ['nav', 'sections', 'backgrounds', 'background-interval-ms', 'background-overlay'];
const themeStorageKey = 'homepage-theme';

function getStoredTheme() {
    try {
        const theme = window.localStorage && window.localStorage.getItem(themeStorageKey);
        return ['dark', 'light'].includes(theme) ? theme : null;
    } catch {
        return null;
    }
}

function getPreferredTheme() {
    return getStoredTheme() || 'dark';
}

function applyTheme(theme) {
    const nextTheme = theme === 'light' ? 'light' : 'dark';

    if (document.documentElement) {
        document.documentElement.setAttribute('data-theme', nextTheme);
    }

    if (typeof document.getElementById !== 'function') {
        return;
    }

    const toggle = document.getElementById('theme-toggle');
    if (!toggle) {
        return;
    }

    const icon = toggle.querySelector('i');
    const isDark = nextTheme === 'dark';
    toggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    toggle.title = isDark ? 'Switch to light theme' : 'Switch to dark theme';

    if (icon) {
        icon.className = isDark ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
    }
}

function initThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) {
        return;
    }

    applyTheme(getPreferredTheme());
    toggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        try {
            window.localStorage.setItem(themeStorageKey, nextTheme);
        } catch {
            // Theme switching should still work if storage is unavailable.
        }
        applyTheme(nextTheme);
    });
}

applyTheme(getPreferredTheme());

function stringifyValue(value) {
    return value == null ? '' : value.toString();
}

function decodeText(value) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = String(value);
    return textarea.value;
}

function setElementValue(element, value) {
    if (value && typeof value === 'object') {
        if ('text' in value) {
            element.textContent = decodeText(value.text);
        }
        if ('href' in value && element instanceof HTMLAnchorElement) {
            element.href = value.href;
        }
        return;
    }

    element.textContent = decodeText(value);
}

function renderNavigation(navItems) {
    const navbarItems = document.getElementById('navbar-items');
    if (!navbarItems || !Array.isArray(navItems)) {
        return;
    }

    navbarItems.replaceChildren();

    navItems.forEach((item) => {
        if (!item || !item.text || !item.href) {
            return;
        }

        const listItem = document.createElement('li');
        const link = document.createElement('a');

        listItem.className = 'nav-item';
        link.className = 'nav-link me-lg-3';
        link.href = item.href;
        link.textContent = decodeText(item.text);

        listItem.appendChild(link);
        navbarItems.appendChild(listItem);
    });
}

function normalizeSections(sections) {
    if (!Array.isArray(sections)) {
        return [];
    }

    return sections
        .map((section) => {
            if (typeof section === 'string' && section.trim() !== '') {
                return {
                    id: section,
                    nav: section.toUpperCase(),
                    href: '#' + section,
                };
            }

            if (!section || typeof section !== 'object' || !section.id) {
                return null;
            }

            return {
                id: section.id,
                nav: section.nav || section.text || section.id.toUpperCase(),
                title: section.title || section.heading || section.nav || section.text || section.id.toUpperCase(),
                icon: section.icon || '',
                href: section.href || '#' + section.id,
            };
        })
        .filter(Boolean);
}

function getNavigationItems(yml) {
    const sections = normalizeSections(yml.sections);
    if (sections.length > 0) {
        return sections.map((section) => ({
            text: section.nav,
            href: section.href,
        }));
    }

    return Array.isArray(yml.nav) ? yml.nav : [];
}

function activateScrollSpy() {
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            offset: 74,
        });
    }
}

function bindResponsiveNavbar() {
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );

    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (navbarToggler && window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });
}

function renderSections(sections) {
    const sectionsContainer = document.getElementById('sections');
    if (!sectionsContainer) {
        return;
    }

    sectionsContainer.replaceChildren();

    sections.forEach((section, index) => {
        const sectionElement = document.createElement('section');
        const container = document.createElement('div');
        const header = document.createElement('header');
        const title = document.createElement('h2');
        const body = document.createElement('div');

        sectionElement.id = section.id;
        sectionElement.className = [
            index % 2 === 0 ? 'bg-gradient-primary-to-secondary-light' : 'bg-gradient-primary-to-secondary-gray',
        ].join(' ');

        container.className = 'container px-5';

        if (section.titleId) {
            title.id = section.titleId;
        }

        if (section.icon) {
            const icon = document.createElement('i');
            icon.classList.add('bi', section.icon);
            title.appendChild(icon);
            title.appendChild(document.createTextNode('\u00a0'));
        }

        title.appendChild(document.createTextNode(decodeText(section.title)));
        body.className = 'main-body';
        body.id = section.id + '-md';

        header.appendChild(title);
        container.appendChild(header);
        container.appendChild(body);
        sectionElement.appendChild(container);
        sectionsContainer.appendChild(sectionElement);
    });
}

function normalizeBackgrounds(backgrounds) {
    if (Array.isArray(backgrounds)) {
        return backgrounds.filter((background) => typeof background === 'string' && background.trim() !== '');
    }

    if (typeof backgrounds === 'string' && backgrounds.trim() !== '') {
        return [backgrounds];
    }

    return [];
}

function chooseInitialBackgroundIndex(backgroundCount) {
    if (!Number.isFinite(backgroundCount) || backgroundCount <= 1) {
        return 0;
    }

    return Math.floor(Math.random() * backgroundCount);
}

window.chooseInitialBackgroundIndex = chooseInitialBackgroundIndex;

function initBackgroundSlideshow(yml) {
    const backgrounds = normalizeBackgrounds(yml.backgrounds);
    const layers = [...document.querySelectorAll('.top-section-bg')];
    const interval = Number(yml['background-interval-ms']) || 7000;
    const overlay = Number(yml['background-overlay']);

    if (Number.isFinite(overlay)) {
        document.documentElement.style.setProperty('--top-section-overlay', Math.min(0.85, Math.max(0, overlay)));
    }

    if (backgrounds.length === 0 || layers.length === 0) {
        return;
    }

    let activeLayer = 0;
    let activeBackground = chooseInitialBackgroundIndex(backgrounds.length);

    layers[activeLayer].style.backgroundImage = `url("${backgrounds[activeBackground]}")`;

    if (backgrounds.length === 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    window.setInterval(() => {
        const nextLayer = activeLayer === 0 ? 1 : 0;
        activeBackground = (activeBackground + 1) % backgrounds.length;

        layers[nextLayer].style.backgroundImage = `url("${backgrounds[activeBackground]}")`;
        layers[nextLayer].classList.add('top-section-bg-active');
        layers[activeLayer].classList.remove('top-section-bg-active');
        activeLayer = nextLayer;
    }, Math.max(2500, interval));
}

function sanitizeMarkdownHtml(html) {
    const template = document.createElement('template');
    template.innerHTML = html;

    template.content.querySelectorAll('script, style, iframe, object, embed, link, meta, base, form, input, button').forEach((node) => {
        node.remove();
    });

    template.content.querySelectorAll('*').forEach((node) => {
        [...node.attributes].forEach((attribute) => {
            const name = attribute.name.toLowerCase();
            const value = attribute.value.trim();

            if (name.startsWith('on')) {
                node.removeAttribute(attribute.name);
                return;
            }

            if (['href', 'src'].includes(name)) {
                try {
                    const url = new URL(value, window.location.href);
                    if (!allowedUrlProtocols.includes(url.protocol)) {
                        node.removeAttribute(attribute.name);
                    }
                } catch {
                    node.removeAttribute(attribute.name);
                }
            }
        });
    });

    return template.innerHTML;
}

function sanitizeInlineHtml(html) {
    const template = document.createElement('template');
    template.innerHTML = html;

    template.content.querySelectorAll('*').forEach((node) => {
        if (!['STRONG', 'B', 'EM', 'I', 'SUP', 'SUB', 'SPAN'].includes(node.tagName)) {
            node.replaceWith(document.createTextNode(node.textContent || ''));
            return;
        }

        [...node.attributes].forEach((attribute) => {
            node.removeAttribute(attribute.name);
        });
    });

    return template.innerHTML;
}

function isSafeUrl(value) {
    try {
        const url = new URL(value, window.location.href);
        return allowedUrlProtocols.includes(url.protocol);
    } catch {
        return false;
    }
}

function typesetMath() {
    if (!window.MathJax || !MathJax.startup || !MathJax.typesetPromise) {
        return Promise.resolve();
    }

    return MathJax.startup.promise.then(() => MathJax.typesetPromise());
}

function loadConfig() {
    return fetch(content_dir + config_file)
        .then(response => response.text())
        .then(text => jsyaml.load(text) || {})
        .catch(error => {
            console.log(error);
            return {};
        });
}

function applyConfig(yml) {
    Object.keys(yml).forEach(key => {
        if (configOnlyKeys.includes(key)) {
            return;
        }

        const element = document.getElementById(key);
        const value = yml[key];

        if (!element) {
            console.log("Unknown id and value: " + key + "," + stringifyValue(value))
            return;
        }

        try {
            setElementValue(element, value);
        } catch {
            console.log("Invalid id and value: " + key + "," + stringifyValue(value))
        }
    });
}

function getConfiguredSections(yml) {
    const sections = normalizeSections(yml.sections);
    if (sections.length > 0) {
        return sections.map((section) => section.id);
    }

    return [...document.querySelectorAll('[id$="-md"]')].map((element) => {
        return element.id.replace(/-md$/, '');
    });
}

function loadMarkdownSection(name) {
    return fetch(content_dir + name + '.md')
        .then(response => response.text())
        .then(markdown => {
            const target = document.getElementById(name + '-md');
            if (!target) {
                console.log("Unknown markdown section: " + name);
                return;
            }

            const html = sanitizeMarkdownHtml(marked.parse(markdown));
            target.innerHTML = html;
        })
        .catch(error => console.log(error));
}

function appendInlineHtml(element, html) {
    element.innerHTML = sanitizeInlineHtml(html || '');
}

function createEducationCard(education) {
    const card = document.createElement('article');
    const badge = document.createElement('div');
    const content = document.createElement('div');
    const institution = document.createElement('h5');
    const major = document.createElement('p');
    const meta = document.createElement('div');

    card.className = 'education-card';
    badge.className = 'education-badge';
    content.className = 'education-content';
    major.className = 'education-major';
    meta.className = 'education-meta';

    badge.textContent = education.degree || '';
    institution.textContent = education.institution || 'Institution';
    major.textContent = education.major || '';

    (Array.isArray(education.meta) ? education.meta : []).forEach((item) => {
        if (!item) {
            return;
        }

        const metaItem = document.createElement('span');
        metaItem.textContent = item;
        meta.appendChild(metaItem);
    });

    content.appendChild(institution);
    if (major.textContent.trim()) {
        content.appendChild(major);
    }
    if (meta.children.length > 0) {
        content.appendChild(meta);
    }
    card.appendChild(badge);
    card.appendChild(content);
    return card;
}

function renderEducation(items) {
    const root = document.getElementById('education-list-root');
    if (!root || !Array.isArray(items)) {
        return;
    }

    const list = document.createElement('div');
    list.className = 'education-list';

    items.forEach((item) => {
        list.appendChild(createEducationCard(item || {}));
    });

    root.replaceChildren(list);
}

function loadEducationData() {
    return fetch(content_dir + education_file)
        .then(response => {
            if (!response.ok) {
                return null;
            }
            return response.text();
        })
        .then(text => {
            if (!text) {
                return;
            }
            const data = jsyaml.load(text) || {};
            renderEducation(data.education || []);
        })
        .catch(error => console.log(error));
}

function createNewsItem(news) {
    const item = document.createElement('div');
    const date = document.createElement('time');
    const text = document.createElement('p');

    item.className = 'news-item';
    date.textContent = news.date || '';
    appendInlineHtml(text, news.text || '');

    item.appendChild(date);
    item.appendChild(text);
    return item;
}

function renderNews(items) {
    const root = document.getElementById('news-list-root') || document.getElementById('news-md');
    if (!root || !Array.isArray(items)) {
        return;
    }

    const list = document.createElement('div');
    list.className = 'news-list';

    items.forEach((item) => {
        list.appendChild(createNewsItem(item || {}));
    });

    root.replaceChildren(list);
}

function loadNewsData() {
    return fetch(content_dir + news_file)
        .then(response => {
            if (!response.ok) {
                return null;
            }
            return response.text();
        })
        .then(text => {
            if (!text) {
                return;
            }
            const data = jsyaml.load(text) || {};
            renderNews(data.news || []);
        })
        .catch(error => console.log(error));
}

function formatPublicationType(type) {
    return type === 'conference' ? 'Conference' : 'Journal';
}

function normalizePublicationStatus(status) {
    return String(status || 'published').toLowerCase().replace(/\s+/g, '-');
}

function formatPublicationStatus(status) {
    const normalized = normalizePublicationStatus(status);
    if (normalized === 'under-review') {
        return 'Under Review';
    }
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function appendPublicationTag(container, className, text) {
    if (!text) {
        return;
    }

    const tag = document.createElement('span');
    tag.className = className;
    tag.textContent = text;
    container.appendChild(tag);
}

function appendPublicationLink(container, link) {
    if (!link || !link.href || !link.label || !isSafeUrl(link.href)) {
        return;
    }

    const anchor = document.createElement('a');
    anchor.href = link.href;
    anchor.target = '_blank';
    anchor.rel = 'noopener';
    anchor.textContent = link.label;
    container.appendChild(anchor);
}

function ensureImagePreview() {
    let preview = document.getElementById('image-preview');
    if (preview) {
        return preview;
    }

    preview = document.createElement('div');
    const button = document.createElement('button');
    const image = document.createElement('img');

    preview.id = 'image-preview';
    preview.className = 'image-preview';
    preview.hidden = true;
    button.className = 'image-preview-close';
    button.type = 'button';
    button.setAttribute('aria-label', 'Close image preview');
    button.textContent = '×';
    image.alt = '';

    button.addEventListener('click', closeImagePreview);
    preview.addEventListener('click', (event) => {
        if (event.target === preview) {
            closeImagePreview();
        }
    });

    preview.appendChild(button);
    preview.appendChild(image);
    document.body.appendChild(preview);
    return preview;
}

function openImagePreview(src, alt) {
    if (!src || !isSafeUrl(src)) {
        return;
    }

    const preview = ensureImagePreview();
    const image = preview.querySelector('img');
    image.src = src;
    image.alt = alt || 'Publication image preview';
    preview.hidden = false;
    document.body.classList.add('preview-open');
}

function closeImagePreview() {
    const preview = document.getElementById('image-preview');
    if (!preview) {
        return;
    }

    preview.hidden = true;
    document.body.classList.remove('preview-open');
}

function createPublicationCard(publication) {
    const card = document.createElement('article');
    const thumb = document.createElement(publication.image ? 'button' : 'div');
    const content = document.createElement('div');
    const heading = document.createElement('div');
    const title = document.createElement('h3');
    const authors = document.createElement('p');
    const venue = document.createElement('p');
    const links = document.createElement('div');
    const category = publication.type === 'conference' ? 'conference' : 'journal';
    const status = normalizePublicationStatus(publication.status);

    card.className = publication.featured ? 'publication-card publication-card-featured' : 'publication-card';
    card.dataset.category = category;
    card.dataset.status = status;

    thumb.className = 'publication-thumb';
    if (thumb instanceof HTMLButtonElement) {
        thumb.type = 'button';
        thumb.setAttribute('aria-label', 'Open publication image preview');
    }

    if (publication.image && isSafeUrl(publication.image)) {
        const image = document.createElement('img');
        image.src = publication.image;
        image.alt = publication.image_alt || publication.title || 'Publication thumbnail';
        thumb.appendChild(image);
        thumb.addEventListener('click', () => openImagePreview(publication.image, image.alt));
    } else {
        thumb.classList.add('publication-thumb-placeholder');
        thumb.textContent = publication.venue_tag || formatPublicationType(category);
    }

    content.className = 'publication-content';
    heading.className = 'publication-heading';
    appendPublicationTag(heading, 'publication-tag', publication.venue_tag);
    title.textContent = publication.title || 'Untitled publication';
    heading.appendChild(title);

    authors.className = 'publication-authors';
    authors.innerHTML = sanitizeInlineHtml(publication.authors || '');

    venue.className = 'publication-venue';
    if (publication.venue) {
        const strong = document.createElement('strong');
        strong.textContent = publication.venue;
        venue.appendChild(strong);
        if (publication.year) {
            venue.appendChild(document.createTextNode(', ' + publication.year));
        }
    } else if (publication.year) {
        venue.textContent = String(publication.year);
    }

    links.className = 'publication-links';
    appendPublicationTag(links, 'publication-kind', formatPublicationType(category));
    appendPublicationTag(links, 'publication-status', formatPublicationStatus(status));
    (Array.isArray(publication.links) ? publication.links : []).forEach((link) => appendPublicationLink(links, link));

    content.appendChild(heading);
    if (authors.textContent.trim()) {
        content.appendChild(authors);
    }
    if (venue.textContent.trim()) {
        content.appendChild(venue);
    }
    content.appendChild(links);
    card.appendChild(thumb);
    card.appendChild(content);

    return card;
}

function renderPublications(publications) {
    const root = document.getElementById('publication-list-root') || document.getElementById('publications-md');
    if (!root || !Array.isArray(publications)) {
        return;
    }

    const list = document.createElement('div');
    list.className = 'publication-list';

    publications.forEach((publication) => {
        list.appendChild(createPublicationCard(publication || {}));
    });

    root.replaceChildren(list);
}

function loadPublicationsData() {
    return fetch(content_dir + publications_file)
        .then(response => {
            if (!response.ok) {
                return null;
            }
            return response.text();
        })
        .then(text => {
            if (!text) {
                return;
            }
            const data = jsyaml.load(text) || {};
            renderPublications(data.publications || []);
        })
        .catch(error => console.log(error));
}

function initPublicationFilters() {
    const publications = document.getElementById('publications-md');
    const list = publications && publications.querySelector('.publication-list');
    const listContainer = list && list.parentElement ? list.parentElement : publications;
    if (!publications || !list || publications.querySelector('.publication-controls')) {
        return;
    }

    const controls = document.createElement('div');
    const searchLabel = document.createElement('label');
    const searchIcon = document.createElement('i');
    const searchInput = document.createElement('input');
    const filterGroups = document.createElement('div');
    const typeFilters = document.createElement('div');
    const statusFilters = document.createElement('div');
    const empty = document.createElement('p');
    const typeItems = [
        { value: 'all', text: 'All' },
        { value: 'journal', text: 'Journal' },
        { value: 'conference', text: 'Conference' },
    ];
    const statusItems = [
        { value: 'all', text: 'All Status' },
        { value: 'published', text: 'Published' },
        { value: 'accepted', text: 'Accepted' },
        { value: 'under-review', text: 'Under Review' },
    ];

    controls.className = 'publication-controls';
    searchLabel.className = 'publication-search';
    searchLabel.setAttribute('aria-label', 'Search publications');
    searchIcon.className = 'bi bi-search';
    searchInput.type = 'search';
    searchInput.placeholder = 'Search publications';
    searchInput.autocomplete = 'off';

    filterGroups.className = 'publication-filter-groups';
    typeFilters.className = 'publication-filter';
    typeFilters.setAttribute('aria-label', 'Publication type');
    statusFilters.className = 'publication-filter';
    statusFilters.setAttribute('aria-label', 'Publication status');

    function appendFilterButton(group, item, dataName) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = item.value === 'all' ? 'active' : '';
        button.dataset[dataName] = item.value;
        button.textContent = item.text;
        group.appendChild(button);
    }

    typeItems.forEach((item) => appendFilterButton(typeFilters, item, 'category'));
    statusItems.forEach((item) => appendFilterButton(statusFilters, item, 'status'));

    empty.className = 'publication-empty';
    empty.hidden = true;
    empty.textContent = 'Nothing yet 😢';

    searchLabel.appendChild(searchIcon);
    searchLabel.appendChild(searchInput);
    filterGroups.appendChild(typeFilters);
    filterGroups.appendChild(statusFilters);
    controls.appendChild(searchLabel);
    controls.appendChild(filterGroups);
    listContainer.insertBefore(controls, list);
    listContainer.appendChild(empty);

    function applyPublicationFilters() {
        const query = searchInput.value.trim().toLowerCase();
        const activeCategory = typeFilters.querySelector('button.active')?.dataset.category || 'all';
        const activeStatus = statusFilters.querySelector('button.active')?.dataset.status || 'all';
        const cards = [...list.querySelectorAll('.publication-card')];
        let visibleCount = 0;

        cards.forEach((card) => {
            const category = card.dataset.category || 'journal';
            const status = card.dataset.status || 'published';
            const matchesCategory = activeCategory === 'all' || category === activeCategory;
            const matchesStatus = activeStatus === 'all' || status === activeStatus;
            const matchesQuery = !query || card.textContent.toLowerCase().includes(query);
            const isVisible = matchesCategory && matchesStatus && matchesQuery;
            card.hidden = !isVisible;
            if (isVisible) {
                visibleCount += 1;
            }
        });

        empty.hidden = visibleCount !== 0;
    }

    filterGroups.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-category], button[data-status]');
        if (!button) {
            return;
        }

        const group = button.closest('.publication-filter');
        group.querySelectorAll('button').forEach((item) => item.classList.toggle('active', item === button));
        applyPublicationFilters();
    });

    searchInput.addEventListener('input', applyPublicationFilters);
    applyPublicationFilters();
}

window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeImagePreview();
    }
});

function markSiteReady() {
    document.body.classList.remove('site-loading');
    document.body.classList.add('site-ready');
}

window.addEventListener('DOMContentLoaded', event => {
    marked.use({ mangle: false, headerIds: false });
    initThemeToggle();

    loadConfig()
        .then((yml) => {
            applyConfig(yml);
            const sections = normalizeSections(yml.sections);

            renderNavigation(getNavigationItems(yml));
            renderSections(sections);
            initBackgroundSlideshow(yml);
            activateScrollSpy();
            bindResponsiveNavbar();

            return Promise.all(getConfiguredSections(yml).map(loadMarkdownSection));
        })
        .then(() => loadEducationData())
        .then(() => loadNewsData())
        .then(() => loadPublicationsData())
        .then(() => initPublicationFilters())
        .then(() => typesetMath())
        .catch(error => console.log(error))
        .finally(() => markSiteReady());

}); 
