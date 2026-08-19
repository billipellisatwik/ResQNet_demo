/* ==========================================================================
   RESQNET MULTI-THEME ENGINE v5.1
   Supports 5 Custom Themes: Cyber Dark, Clean Light, Neon Tactical, Crimson Alert, Oceanic Rescue
   Silent Theme Switcher Engine — changes theme seamlessly without popup toast messages.
   ========================================================================== */

class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('resq-theme') || 'dark';
        this.themeOrder = ['dark', 'light', 'tactical', 'crimson', 'oceanic'];
        this.init();
    }

    init() {
        this.applyTheme(this.theme);
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.applyTheme(this.theme);
                this.bindThemeControls();
            });
        } else {
            this.bindThemeControls();
        }
    }

    bindThemeControls() {
        const selects = document.querySelectorAll('#themeSelect');
        selects.forEach(select => {
            select.value = this.theme;
            select.onchange = (e) => {
                this.setTheme(e.target.value);
            };
            select.addEventListener('change', (e) => {
                this.setTheme(e.target.value);
            });
        });
    }

    setTheme(newTheme) {
        this.theme = newTheme;
        localStorage.setItem('resq-theme', newTheme);
        this.applyTheme(newTheme);
    }

    applyTheme(themeName) {
        this.theme = themeName;
        document.documentElement.setAttribute('data-theme', themeName);
        if (document.body) {
            document.body.setAttribute('data-theme', themeName);
            document.body.className = `theme-${themeName}`;
        }

        const selects = document.querySelectorAll('#themeSelect');
        selects.forEach(select => {
            select.value = themeName;
        });
    }
}

window.ResQTheme = new ThemeManager();
