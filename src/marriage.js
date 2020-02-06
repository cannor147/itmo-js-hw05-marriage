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

const compareStrings = (a, b) => {
  if (a < b) {
    return -1;
  } else if (a > b) {
    return 1;
  }

  return 0;
};

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

    let availableAndFilteredGuestCount = 0;
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
      if (possibleGuest.available && possibleGuest.filtered) {
        availableAndFilteredGuestCount++;
      }
    }

    possibleGuests.sort((a, b) => compareStrings(a.person.name, b.person.name));
    for (let i = 0; i < possibleGuests.length; i++) {
      possibleGuestIndexes[possibleGuests[i].person.name] = i;
    }

    this._availableAndFilteredGuestCount = availableAndFilteredGuestCount;
    this._possibleGuestIndexes = possibleGuestIndexes;
    this._possibleGuests = possibleGuests;
    this._index = 0;
  },
  {
    _levelUp() {
      for (let i = 0; i < this._possibleGuests.length; i++) {
        const possibleGuest = this._possibleGuests[i];

        if (possibleGuest.available) {
          possibleGuest.ready = true;
        }
      }

      this._index = 0;
    },
    next() {
      let guest = null;

      while (!this.done()) {
        while (this._index < this._possibleGuests.length) {
          const possibleGuest = this._possibleGuests[this._index];

          if (possibleGuest.ready) {
            if (possibleGuest.filtered && guest !== null) {
              return guest;
            }

            for (const friend of possibleGuest.person.friends) {
              const possibleGuestIndex = this._possibleGuestIndexes[friend];
              const newGuest = this._possibleGuests[possibleGuestIndex];

              if (!newGuest.ready && !newGuest.available && !newGuest.used) {
                newGuest.available = true;

                if (newGuest.filtered) {
                  this._availableAndFilteredGuestCount++;
                }
              }
            }

            possibleGuest.used = true;
            possibleGuest.available = false;
            possibleGuest.ready = false;

            if (possibleGuest.filtered) {
              this._availableAndFilteredGuestCount--;
              guest = possibleGuest.person;
            }
          }
          this._index++;
        }
        this._levelUp();
      }

      return guest;
    },
    done() {
      return this._availableAndFilteredGuestCount === 0;
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
      Iterator.prototype._levelUp.call(this);
      this.level++;
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
