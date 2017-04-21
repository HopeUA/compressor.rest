import ShortId from 'shortid';

module.exports = (State) => {
    State.prototype.setProgress = function(progress) {
        let value = parseInt(progress, 10);
        if (value <= 0) {
            value = 1;
        }
        if (value >= 100) {
            value = 99
        }

        if (value !== this.progress) {
            this.progress = value;
            process.nextTick(() => {
                this.save();
            });
        }
    };

    State.prototype.finish = function() {
        this.progress = 100;
        process.nextTick(() => {
            this.save();
        });
    };

    State.prototype.addEvent = async function(type, data) {
        const Event = State.app.models.Event;

        const event = new Event({
            id: ShortId.generate(),
            date: new Date(),
            type,
            data
        });

        this.events.push(event);
        process.nextTick(() => {
            this.save();
        });
    };

    State.prototype.error = function(message) {
        return this.addEvent('error', { message })
    }
};
