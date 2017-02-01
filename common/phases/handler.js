export default class StateHandler {
    constructor(state, data, options = {}) {
        this.state = state;
        this.data  = data;
        this.options = options;
        this.store = {};
    }

    init() {}
    process() {}
    finish() {
        this.state.finish();
    }
}
