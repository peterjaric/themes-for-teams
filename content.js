// Teams Chat Padding Fix Content Script

(function () {
    'use strict';

    const ext = typeof browser !== 'undefined' ? browser : chrome;
    const forcedThemeVars = {
        /* Primary Brand Colors */
        '--colorBrandBackground': 'var(--primary-brand)',
        '--colorBrandBackgroundHover': 'var(--primary-hover)',
        '--colorBrandBackgroundPressed': 'var(--primary-pressed)',
        '--colorBrandBackgroundSelected': 'var(--primary-selected)',
        '--colorBrandBackgroundStatic': 'var(--primary-selected)',
        '--colorBrandBackground2Hover': 'var(--primary-brand)',
        '--colorBrandBackground2Pressed': 'var(--secondary-pressed)',
        '--colorBrandBackground3Static': 'var(--primary-brand)',
        '--colorBrandBackground4Static': 'var(--secondary-brand)',
        '--colorCompoundBrandBackground': 'var(--primary-hover)',
        '--colorCompoundBrandBackgroundHover': 'var(--primary-selected)',
        '--colorCompoundBrandBackgroundPressed': 'var(--primary-brand)',

        /* Brand Foreground Colors */
        '--colorBrandForeground1': 'var(--primary-selected)',
        '--colorBrandForeground2': 'var(--primary-brand)',
        '--colorBrandForegroundLink': 'var(--primary-brand)',
        '--colorBrandForegroundLinkHover': 'var(--primary-selected)',
        '--colorBrandForegroundLinkPressed': 'var(--secondary-brand)',
        '--colorBrandForegroundLinkSelected': 'var(--primary-selected)',
        '--colorBrandForegroundInverted': 'var(--primary-brand)',
        '--colorBrandForegroundInvertedHover': 'var(--secondary-brand)',
        '--colorBrandForegroundInvertedPressed': 'var(--primary-pressed)',
        '--colorBrandForegroundOnLight': 'var(--primary-brand)',
        '--colorBrandForegroundOnLightHover': 'var(--secondary-brand)',
        '--colorBrandForegroundOnLightPressed': 'var(--primary-pressed)',
        '--colorBrandForegroundOnLightSelected': 'var(--secondary-brand)',
        '--colorCompoundBrandForeground1': 'var(--primary-selected)',
        '--colorCompoundBrandForeground1Hover': 'var(--primary-brand)',
        '--colorCompoundBrandForeground1Pressed': 'var(--primary-brand)',

        /* Neutral Foreground Brand Colors */
        '--colorNeutralForeground2BrandHover': 'var(--primary-brand)',
        '--colorNeutralForeground2BrandPressed': 'var(--primary-selected)',
        '--colorNeutralForeground2BrandSelected': 'var(--primary-brand)',
        '--colorNeutralForeground3BrandHover': 'var(--primary-brand)',
        '--colorNeutralForeground3BrandPressed': 'var(--primary-selected)',

        /* Stroke Colors */
        '--colorBrandStroke1': 'var(--primary-brand)',
        '--colorBrandStroke2': 'var(--secondary-brand)',
        '--colorBrandStroke2Hover': 'var(--primary-brand)',
        '--colorBrandStroke2Pressed': 'var(--primary-pressed)',
        '--colorBrandStroke2Contrast': 'var(--secondary-brand)',
        '--colorCompoundBrandStroke': 'var(--primary-selected)',
        '--colorCompoundBrandStrokeHover': 'var(--primary-brand)',
        '--colorCompoundBrandStrokePressed': 'var(--primary-brand)',
        '--colorNeutralStrokeAccessibleSelected': 'var(--primary-brand)',

        /* Avatar Colors */
        '--colorAvatar': 'var(--primary-brand)',
        '--colorAvatarBackground': 'var(--primary-brand)',

        /* Teams Specific Colors */
        '--colorTeamsBrand1Hover': 'var(--primary-brand)',
        '--colorTeamsBrand1Pressed': 'var(--primary-selected)',
        '--colorTeamsBrand1Selected': 'var(--primary-brand)'
    };
    let providerObserver = null;
    let forceVarsQueued = false;

    function applyForcedThemeVars() {
        const targets = [document.documentElement, ...document.querySelectorAll('.fui-FluentProvider')];

        for (const target of targets) {
            for (const [name, value] of Object.entries(forcedThemeVars)) {
                target.style.setProperty(name, value, 'important');
            }
        }
    }

    function queueApplyForcedThemeVars() {
        if (forceVarsQueued) {
            return;
        }

        forceVarsQueued = true;
        queueMicrotask(() => {
            forceVarsQueued = false;
            applyForcedThemeVars();
        });
    }

    function scheduleForcedThemeVarPasses() {
        queueApplyForcedThemeVars();
        setTimeout(queueApplyForcedThemeVars, 150);
        setTimeout(queueApplyForcedThemeVars, 600);
        setTimeout(queueApplyForcedThemeVars, 1800);
    }

    function connectProviderObserver() {
        if (providerObserver) {
            return;
        }

        providerObserver = new MutationObserver((mutations) => {
            let shouldReapply = false;

            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (!(node instanceof Element)) {
                        continue;
                    }

                    if (node.matches('.fui-FluentProvider') || node.querySelector('.fui-FluentProvider')) {
                        shouldReapply = true;
                        break;
                    }
                }

                if (shouldReapply) {
                    break;
                }
            }

            if (shouldReapply) {
                queueApplyForcedThemeVars();
            }
        });

        providerObserver.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    // Cross-browser storage helper
    function storageGet(keys) {
        return new Promise((resolve) => {
            if (ext.storage.sync.get.length > 1) {
                // Chrome-style callback
                ext.storage.sync.get(keys, resolve);
            } else {
                // Firefox-style promise
                ext.storage.sync.get(keys).then(resolve);
            }
        });
    }

    function storageSet(items) {
        return new Promise((resolve) => {
            if (ext.storage.sync.set.length > 1) {
                // Chrome-style callback
                ext.storage.sync.set(items, resolve);
            } else {
                // Firefox-style promise
                ext.storage.sync.set(items).then(resolve);
            }
        });
    }

    // Font selection function
    function injectFont(font) {
        // Remove any previously injected font
        const oldFontStyle = document.getElementById('teams-font-style');
        if (oldFontStyle) {
            oldFontStyle.remove();
        }

        // Remove any previously injected font link
        const oldFontLink = document.getElementById('teams-font-link');
        if (oldFontLink) {
            oldFontLink.remove();
        }

        // Skip if default font
        if (font === 'default' || !font) {
            return;
        }

        // Define font families with fallbacks
        const fontFamilies = {
            'default': 'inherit',
            'arial': '"Arial"',
            'comic-sans': '"Comic Sans MS", "Comic Sans", cursive',
            'lato': '"Lato"',
            'georgia': '"Georgia", "Times New Roman", Times, serif',
            'noto-sans': '"Noto Sans"',
            'roboto-mono': '"Roboto Mono", "Cascadia Mono", Consolas, ui-monospace, Menlo, Monaco, monospace',
            'verdana': '"Verdana", Geneva, Tahoma',
        };

        const fontFamily = fontFamilies[font] + ', -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
        if (!fontFamily) return;

        // Inject Google Fonts link for Lato
        if (font === 'lato') {
            const link = document.createElement('link');
            link.id = 'teams-font-link';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css?family=Lato:400,700&display=swap';
            document.head.appendChild(link);
        }

        // Create CSS for font override
        const fontCSS = `
            :root,
            html,
            body,
            #app,
            .fui-FluentProvider,
            .fui-FluentProvider[class*="fui-FluentProvider"],
            [data-theme],
            .app-chrome {
                --fontFamilyBase: ${fontFamily} !important;
                --fontFamilyMonospace: ${font === 'roboto-mono' ? fontFamily : '"Roboto Mono", "Cascadia Mono", Consolas, ui-monospace, Menlo, Monaco, monospace'} !important;
            }
        `;

        // Inject font CSS
        const style = document.createElement('style');
        style.id = 'teams-font-style';
        style.textContent = fontCSS;
        document.head.appendChild(style);
    }

    // Theme selection logic - modular system with base + palette
    function injectTheme(theme) {
        // Remove any previously injected themes
        const oldBaseStyle = document.getElementById('teams-base-theme-style');
        const oldPaletteStyle = document.getElementById('teams-palette-style');
        if (oldBaseStyle) oldBaseStyle.remove();
        if (oldPaletteStyle) oldPaletteStyle.remove();

        // For default theme, styles.css is already injected by the manifest
        if (theme === 'default') {
            scheduleForcedThemeVarPasses();
            return;
        }

        // For themed options, load base + palette
        const supportedThemes = [
            'purple', 'lagoon', 'amber', 'forest', 'midnight',
            'rose', 'sunset', 'dracula', 'monokai', 'ocean',
            'cherry', 'mint', 'cosmic', 'sun-shaft'
        ];

        if (!supportedThemes.includes(theme)) {
            console.warn('Teams Theme Extension: Unknown theme, falling back to default');
            injectTheme('default');
            return;
        }

        // Load base theme first, then palette
        Promise.all([
            fetch(ext.runtime.getURL('themes/base-theme.css')).then(r => r.text()),
            fetch(ext.runtime.getURL(`themes/${theme}-theme.css`)).then(r => r.text())
        ])
            .then(([baseCss, paletteCss]) => {
                // Inject palette first (defines variables)
                const paletteStyle = document.createElement('style');
                paletteStyle.id = 'teams-palette-style';
                paletteStyle.textContent = paletteCss;
                document.head.appendChild(paletteStyle);

                // Then inject base theme (uses variables)
                const baseStyle = document.createElement('style');
                baseStyle.id = 'teams-base-theme-style';
                baseStyle.textContent = baseCss;
                document.head.appendChild(baseStyle);

                scheduleForcedThemeVarPasses();

            })
            .catch(error => {
                console.error('Teams Theme Extension: Error loading modular theme:', error);
                // Fallback to default
                injectTheme('default');
            });
    }

    // Inject No Animations CSS if enabled
    function injectNoAnimations(enabled) {
        const styleId = 'teams-no-animations-style';
        const oldStyle = document.getElementById(styleId);
        if (oldStyle) oldStyle.remove();
        if (enabled) {
            fetch(ext.runtime.getURL('no-animations.css'))
                .then(response => response.text())
                .then(css => {
                    const style = document.createElement('style');
                    style.id = styleId;
                    style.textContent = css;
                    document.head.appendChild(style);
                })
                .catch(error => {
                    console.error('Teams Theme Extension: Error loading no-animations.css:', error);
                });
        }
    }

    storageGet(['teamsTheme', 'teamsFont', 'teamsDisableAnimations']).then(result => {
        injectTheme(result.teamsTheme || 'default');
        injectFont(result.teamsFont || 'default');
        injectNoAnimations(result.teamsDisableAnimations || false);
        connectProviderObserver();
        scheduleForcedThemeVarPasses();
    });

    // Listen for changes and apply live
    ext.storage.onChanged.addListener(function (changes, areaName) {
        if (areaName === 'sync') {
            if (changes.teamsTheme) {
                injectTheme(changes.teamsTheme.newValue || 'default');
            }
            if (changes.teamsFont) {
                injectFont(changes.teamsFont.newValue || 'default');
            }
            if (changes.teamsDisableAnimations) {
                injectNoAnimations(changes.teamsDisableAnimations.newValue || false);
            }

            scheduleForcedThemeVarPasses();
        }
    });
})();