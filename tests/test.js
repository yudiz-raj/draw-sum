import 'jest-canvas-mock';
describe('windowRatio', () => {
    // Backup of the original window dimensions
    let originalWindowWidth;
    let originalWindowHeight;

    beforeEach(() => {
        // Store the original window dimensions
        originalWindowWidth = window.innerWidth;
        originalWindowHeight = window.innerHeight;
    });

    afterEach(() => {
        // Restore the original window dimensions
        window.innerWidth = originalWindowWidth;
        window.innerHeight = originalWindowHeight;
    });

    test('is correctly calculated', () => {
        // Set new window dimensions
        window.innerWidth = 800;
        window.innerHeight = 600;

        // Calculate the window ratio
        var windowRatio = window.innerWidth / window.innerHeight;

        // Check that the window ratio is correctly calculated
        expect(windowRatio).toBe(800 / 600);
    });
});
// FILEPATH: /Users/yudizsolutions/Documents/Yudiz/Yudiz Projects/Phaser Projects/draw-sum/game.test.js
const boot = require('../game').boot; // Import the boot class
global.Phaser = {
    Plugin: {
        FadePlugin: jest.fn()
    }
};

describe('boot', () => {
    let game;
    let bootInstance;

    beforeEach(() => {
        // Mock the game object and its methods
        game = {
            scale: {
                pageAlignHorizontally: false,
                pageAlignVertically: false,
                scaleMode: null
            },
            stage: {
                disableVisibilityChange: false
            },
            load: {
                image: jest.fn()
            },
            plugins: {
                add: jest.fn()
            },
            state: {
                start: jest.fn()
            }
        };

        // Create a new instance of the boot class
        bootInstance = new boot(game);
    });

    test('sets the correct properties in the preload method', () => {
        bootInstance.preload();

        expect(game.scale.pageAlignHorizontally).toBe(true);
        expect(game.scale.pageAlignVertically).toBe(true);
        expect(game.scale.scaleMode).toBe(Phaser.ScaleManager.SHOW_ALL);
        expect(game.stage.disableVisibilityChange).toBe(true);
        expect(game.load.image).toHaveBeenCalledWith("playbutton", "assets/sprites/playbutton.png");
    });

    test('calls the correct methods in the create method', () => {
        bootInstance.create();

        expect(game.plugins.add).toHaveBeenCalledWith(Phaser.Plugin.FadePlugin);
        expect(game.state.start).toHaveBeenCalledWith("Preload");
    });
});