import Navigation from "./modules/navigation.js";
import ScrollManager from "./modules/scroll.js";
import ObserverManager from "./core/observer.js";
import CustomCursor from "./modules/cursor.js";
import LoadContent from "./core/contentLoader.js";
import Theme from "./modules/theme.js";

class Portfolio {
    constructor() {
        this.initialize();

    }

    initialize() {
        new Navigation();
        new ScrollManager();
        new ObserverManager()
        new CustomCursor();
        new LoadContent();
        new Theme();
    }
}

new Portfolio();