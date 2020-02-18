'use strict';

/**
 * @typedef {Object} Friend
 * @property {string} name Имя
 * @property {'male' | 'female'} gender Пол
 * @property {boolean} best Лучший ли друг?
 * @property {string[]} friends Список имён друзей
 */

function createExtension(baseClass, constructor, prototype) {
  constructor.prototype = prototype;
  Object.setPrototypeOf(constructor.prototype, baseClass.prototype);
  Object.defineProperty(constructor.prototype, 'constructor', {
    value: constructor,
    enumerable: false
  });

  return constructor;
}

/**
 * Фильтр друзей
 * @constructor
 */
const Filter = createExtension(Object, function() {}, {
  test() {
    return true;
  }
});

/**
 * Фильтр друзей-парней
 * @extends Filter
 * @constructor
 */
const MaleFilter = createExtension(Filter, function() {}, {
  test(friend) {
    return friend.gender === 'male';
  }
});

/**
 * Фильтр друзей-девушек
 * @extends Filter
 * @constructor
 */
const FemaleFilter = createExtension(Filter, function() {}, {
  test(friend) {
    return friend.gender === 'female';
  }
});

/**
 * Итератор по друзьям
 * @constructor
 * @param {Friend[]} friends Список друзей
 * @param {Filter} filter Фильтр друзей
 */
const Iterator = createExtension(
  Object,
  function(friends, filter) {
    if (!(filter instanceof Filter)) {
      throw new TypeError("Argument 'filter' expected to be a Filter instance.");
    }

    const possibleGuests = [];
    const possibleGuestIndexes = [];

    for (const friend of friends) {
      const possibleGuest = {
        person: friend,
        filtered: filter.test(friend),
        available: friend.best,
        ready: friend.best,
        used: false
      };

      possibleGuests.push(possibleGuest);
    }

    possibleGuests.sort((a, b) => a.person.name.localeCompare(b.person.name));
    for (let i = 0; i < possibleGuests.length; i++) {
      possibleGuestIndexes[possibleGuests[i].person.name] = i;
    }

    this._possibleGuestIndexes = possibleGuestIndexes;
    this._possibleGuests = possibleGuests;
    this._index = 0;
    this._currentGuest = this._findNext();
  },
  {
    _levelUp() {
      let readyCount = 0;
      this._index = 0;

      for (let i = 0; i < this._possibleGuests.length; i++) {
        const possibleGuest = this._possibleGuests[i];

        if (possibleGuest.available && !possibleGuest.used) {
          possibleGuest.ready = true;
          readyCount++;
        }
      }

      return readyCount;
    },
    _findNext() {
      let changes = true;

      while (changes) {
        while (this._index < this._possibleGuests.length) {
          const possibleGuest = this._possibleGuests[this._index];

          if (possibleGuest.ready) {
            for (const friend of possibleGuest.person.friends) {
              const possibleGuestIndex = this._possibleGuestIndexes[friend];
              const newGuest = this._possibleGuests[possibleGuestIndex];

              if (!newGuest.ready && !newGuest.available && !newGuest.used) {
                newGuest.available = true;
              }
            }

            possibleGuest.used = true;
            possibleGuest.available = false;
            possibleGuest.ready = false;

            if (possibleGuest.filtered) {
              this._index++;

              return possibleGuest.person;
            }
          }
          this._index++;
        }

        const readyCount = this._levelUp();
        changes = readyCount > 0;
      }

      return null;
    },
    next() {
      const result = this._currentGuest;
      if (!this.done()) {
        this._currentGuest = this._findNext();
      }

      return result;
    },
    done() {
      return this._currentGuest === null;
    }
  }
);

/**
 * Итератор по друзям с ограничением по кругу
 * @extends Iterator
 * @constructor
 * @param {Friend[]} friends Список друзей
 * @param {Filter} filter Фильтр друзей
 * @param {Number} maxLevel Максимальный круг друзей
 */
const LimitedIterator = createExtension(
  Iterator,
  function(friends, filter, maxLevel) {
    Iterator.call(this, friends, filter);

    this.level = 1;
    this.maxLevel = maxLevel;
  },
  {
    _levelUp() {
      this.level++;

      return this.level > this.maxLevel ? 0 : Iterator.prototype._levelUp.call(this);
    },
    done() {
      return Iterator.prototype.done.call(this) || this.level > this.maxLevel;
    }
  }
);

module.exports = {
  Iterator,
  LimitedIterator,
  Filter,
  MaleFilter,
  FemaleFilter
};
