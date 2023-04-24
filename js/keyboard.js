const KeyStates = {
    UP: 0,
    UNLOCKED: 1,
    JUST_PRESSED: 2,
    REPEATING: 3,
    LAST: 4,
};

class KeyState {
    #state = KeyStates.UP;

    reset() { this.#state = KeyStates.UP; }
    unlock() { this.#state = KeyStates.UNLOCKED; }
    advance() {
        if (this.#state >= KeyStates.UNLOCKED) {
            this.#state = Math.min(this.#state + 1, KeyStates.LAST - 1);
        }
    }

    isDown() { return !this.isUp(); }
    isUp() { return this.#state === KeyStates.UP; }
    justPressed() { return this.#state === KeyStates.JUST_PRESSED; }
    repeating() { return this.#state === KeyStates.REPEATING; }
}

class Keyboard {
    #mappings = new Map()

    constructor() {
        const keyCodes = {
            forward: "KeyW",
            backward: "KeyS",
            left: "KeyA",
            right: "KeyD",
            brake: "Space",
            camera: "KeyC",
            headlight: "KeyL",
            daynight: "KeyN",
        };

        for (const [k, v] of Object.entries(keyCodes)) {
            this.#mappings.set(v, new KeyState());
            Object.defineProperty(
                this,
                k,
                { get() { return this.#mappings.get(v) } },
            );
        }

        window.addEventListener("keydown", (event) => {
            const state = this.#mappings.get(event.code);
            if (state !== undefined && state.isUp()) {
                state.unlock();
            }
        });

        window.addEventListener("keyup", (event) => {
            const state = this.#mappings.get(event.code);
            if (state !== undefined) {
                state.reset();
            }
        });

        syncList.push(() => {
            for (const state of this.#mappings.values()) {
                state.advance();
            }
        });
    }
}
