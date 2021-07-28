class Time {
    constructor(date) {
        if (!date) date = new Date();

        this._hours = date.getHours();
        this._minutes = date.getMinutes();
        this.date = date;
        this.date.setSeconds(0);
    }

    set hours(hours) {
        this._hours = hours;
        this.date.setHours(hours);
    }

    set minutes(minutes) {
        this._minutes = minutes;
        this.date.setMinutes(minutes);
    }

    get paddedHours() {
        return String(this._hours).padStart(2, "0")
    }

    get paddedMinutes() {
        return String(this._minutes).padStart(2, "0")
    }
}

class Day {
    constructor(date) {
        if (!date) date = new Date();

        this.time = new Time(date);
        this.numberInMonth = date.getDate();
        this.numberInWeek = date.getDay() || 7;
        this.month = date.getMonth() + 1;
        this.year = date.getFullYear();
        this.date = date;
    }

    get isToday() {
        const today = new Day();
        return this.numberInMonth == today.numberInMonth && this.month == today.month && this.year == today.year;
    }
}

class Month {
    constructor(date) {
        const day = new Day(date);

        this.numberOfDays = new Date(day.year, day.month, 0).getDate();
        this.number = day.month;
        this.year = day.year;
        this.date = date;
    }

    get days() {
        const days = [];
        for (let i = 1; i <= this.numberOfDays; i++) {
            days.push(new Day(new Date(this.year, this.number - 1, i)));
        }

        return days;
    }

    get firstDayOffset() {
        return this.days[0].numberInWeek - 1;
    }

    get previousMonth() {
        if (this.number == 1) return new Month(new Date(this.year - 1, 11));
        else return new Month(new Date(this.year, this.number - 2));
    }

    get nextMonth() {
        if (this.number == 12) return new Month(new Date(this.year + 1, 0));
        else return new Month(new Date(this.year, this.number));
    }
}

class Calendar {
    constructor(year, month) {
        this.today = new Day();
        this.year = year || this.today.year;
        this.month = new Month(new Date(this.year, (month || this.today.month) - 1));
    }

    get weekDays() {
        return this.month.days.slice(0, 7).sort((a, b) => a.numberInWeek > b.numberInWeek ? 1 : (a.numberInWeek < b.numberInWeek ? -1 : 0));
    }

    get months() {
        const months = [];
        for (let i = 0; i <= 11; i++) {
            months.push(new Month(new Date(this.year, i, 1)));
        }

        return months;
    }

    setPreviousMonth() {
        this.month = this.month.previousMonth;
        this.year = this.month.year;
    }

    setNextMonth() {
        this.month = this.month.nextMonth;
        this.year = this.month.year;
    }
}

class DateTimePicker extends HTMLElement {
    calendar = new Calendar();
    day = new Day();
    time = new Time();
    locale = "en";

    connectedCallback() {
        this.render();
    }

    get style() {
        return `
            #day-grid-heading, #day-grid {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                grid-gap: .25rem;
            }
        `;
    }

    render() {
        this.innerHTML = `
            <style>${this.style}</style>
            <div class="modal is-active" id="datetime-picker">
                <div class="modal-background"></div>
                <div class="modal-content is-small">
                    <div class="box has-text-centered">
                        <h1 class="title">Date</h1>
                        <div class="mb-5" id="year-month-select">
                            <button class="button is-link is-inverted is-hidden-mobile" id="previous-month-button">
                                <span class="icon">
                                    <i class="fas fa-xs fa-arrow-left"></i>
                                </span>
                            </button>
                            <div class="select" id="picker-years-select"></div>
                            <div class="select" id="picker-months-select"></div>
                            <button class="button is-link is-inverted is-hidden-mobile" id="next-month-button">
                                <span class="icon">
                                    <i class="fas fa-xs fa-arrow-right"></i>
                                </span>
                            </button>
                        </div>
                        <div id="day-grid-heading" class="mb-3"></div>
                        <div class="mb-5" id="day-grid"></div>
                        <div class="mb-5" id="hour-minute-select">
                            <div class="field has-addons is-justify-content-center">
                                <div class="control">
                                    <div class="select" id="picker-hours-select"></div>
                                </div>
                                <div class="control">
                                    <div class="select" id="picker-minutes-select"></div>
                                </div>
                            </div>
                        </div>
                        <div class="buttons is-centered are-small">
                            <button class="button is-danger is-light">Clear</button>
                            <button class="button is-link is-light">Today</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Fill year select
        const years = Array.from({ length: 110 }, (_, i) => i + (this.calendar.year - 100));
        this.querySelector("#picker-years-select").appendChild(this.getSelect(years));

        // Fill month select
        const monthNumbers = Array.from({ length: 12 }, (_, i) => i + 1);
        const monthNames = this.calendar.months.map(month => month.date.toLocaleDateString(this.locale, { month: "long" }));
        this.querySelector("#picker-months-select").appendChild(this.getSelect(monthNumbers, monthNames));

        // Add short names of weekdays
        for (let weekday of this.calendar.weekDays) {
            this.querySelector("#day-grid-heading").insertAdjacentElement("beforeend", this.getDayGridHeading(weekday));
        }

        // Add hour select
        const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
        this.querySelector("#picker-hours-select").appendChild(this.getSelect(hours));

        // Add minute select
        const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
        this.querySelector("#picker-minutes-select").appendChild(this.getSelect(minutes));

        // Render day grid, set current select values and listen to input
        this.setSelectValues();
        this.renderDayGrid();
        this.setIOListeners();
    }

    setSelectValues() {
        this.querySelector("#picker-years-select select").value = this.calendar.year;
        this.querySelector("#picker-months-select select").value = this.calendar.month.number;
        this.querySelector("#picker-hours-select select").value = this.calendar.today.time.paddedHours;
        this.querySelector("#picker-minutes-select select").value = this.calendar.today.time.paddedMinutes;
    }

    renderDayGrid() {
        this.querySelector("#day-grid").innerHTML = "";

        // Add last days from previous month
        const firstDayOffset = this.calendar.month.firstDayOffset;
        const lastDaysPreviousMonth = firstDayOffset ? this.calendar.month.previousMonth.days.slice(-firstDayOffset) : [];
        for (let i = 0; i < lastDaysPreviousMonth.length; i++) {
            this.querySelector("#day-grid").insertAdjacentElement("beforeend", this.getDayGridButton(lastDaysPreviousMonth[i], true));
        }

        // Add days of current month
        for (let day of this.calendar.month.days) {
            this.querySelector("#day-grid").insertAdjacentElement("beforeend", this.getDayGridButton(day));
        }

        // Add first days from next month
        const requiredDays = 42 - firstDayOffset - this.calendar.month.days.length;
        const firstDaysNextMonth = this.calendar.month.nextMonth.days.slice(0, requiredDays);
        for (let i = 0; i < firstDaysNextMonth.length; i++) {
            this.querySelector("#day-grid").insertAdjacentElement("beforeend", this.getDayGridButton(firstDaysNextMonth[i], true));
        }
    }

    getSelect(values, textContents) {
        const select = document.createElement("select");
        for (let i = 0; i < values.length; i++) {
            const option = document.createElement("option");
            option.value = values[i];
            option.textContent = textContents && textContents.length > i ? textContents[i] : values[i];
            select.appendChild(option);
        }

        return select;
    }

    getDayGridHeading(day) {
        const heading = document.createElement("span");
        heading.textContent = day.date.toLocaleDateString(this.locale, { weekday: "short" });

        return heading;
    }

    getDayGridButton(day, disabled) {
        const button = document.createElement("button");
        button.className = "button day-grid-button p-3";
        button.textContent = day ? day.numberInMonth : "";
        if (!disabled && day.isToday) button.classList.add("is-link", "is-light");
        if (!disabled) button.onclick = () => this.day = day;
        else button.classList.add("is-static");
        
        return button;
    }

    setIOListeners() {
        this.querySelector("#picker-years-select select").addEventListener("input", event => {
            this.calendar = new Calendar(event.target.value, this.calendar.month.number);
            this.setSelectValues();
            this.renderDayGrid();
        });

        this.querySelector("#picker-months-select select").addEventListener("input", event => {
            this.calendar = new Calendar(this.calendar.year, event.target.value);
            this.setSelectValues();
            this.renderDayGrid();
        });

        this.querySelector("#previous-month-button").addEventListener("click", () => {
            this.calendar.setPreviousMonth();
            this.setSelectValues();
            this.renderDayGrid();
        });

        this.querySelector("#next-month-button").addEventListener("click", () => {
            this.calendar.setNextMonth();
            this.setSelectValues();
            this.renderDayGrid();
        });

        this.querySelector("#picker-hours-select select").addEventListener("input", event => {
            this.time.hours = parseInt(event.target.value);
        });

        this.querySelector("#picker-minutes-select select").addEventListener("input", event => {
            this.time.minutes = parseInt(event.target.value);
        });
    }
}

window.customElements.define("datetime-picker", DateTimePicker);
