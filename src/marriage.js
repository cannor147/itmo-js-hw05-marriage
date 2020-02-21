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
  function(friends, filter, maxLevel = Number.MAX_SAFE_INTEGER) {
    if (!(filter instanceof Filter)) {
      throw new TypeError("Argument 'filter' expected to be a Filter instance.");
    }

    const possibleGuests = [];
    const nameToPossibleGuestIndexMap = new Map();

    for (const friend of friends) {
      const possibleGuest = {
        person: friend,
        available: friend.best,
        ready: friend.best,
        used: false
      };

      possibleGuests.push(possibleGuest);
    }

    possibleGuests.sort((a, b) => a.person.name.localeCompare(b.person.name));
    for (let i = 0; i < possibleGuests.length; i++) {
      nameToPossibleGuestIndexMap.set(possibleGuests[i].person.name, i);
    }

    this._nameToPossibleGuestIndexMap = nameToPossibleGuestIndexMap;
    this._possibleGuests = possibleGuests;
    this._filter = filter;
    this._maxLevel = maxLevel;
    this._init();
    this._currentGuest = this._findNext();
  },
  {
    _init() {
      this._level = 1;
      this._index = 0;
      this._done = this._level > this._maxLevel;
    },
    _levelUp() {
      this._level++;
      this._index = 0;
      this._done = true;

      if (this._level > this._maxLevel) {
        return;
      }

      for (let i = 0; i < this._possibleGuests.length; i++) {
        const possibleGuest = this._possibleGuests[i];

        if (possibleGuest.available && !possibleGuest.used) {
          possibleGuest.ready = true;
          this._done = false;
        }
      }
    },
    _findNext() {
      while (!this._done) {
        while (this._index < this._possibleGuests.length) {
          const possibleGuest = this._possibleGuests[this._index];

          if (possibleGuest.ready) {
            for (const friend of possibleGuest.person.friends) {
              const possibleGuestIndex = this._nameToPossibleGuestIndexMap.get(friend);
              const newGuest = this._possibleGuests[possibleGuestIndex];

              if (!newGuest.ready && !newGuest.available && !newGuest.used) {
                newGuest.available = true;
              }
            }

            possibleGuest.used = true;
            possibleGuest.available = false;
            possibleGuest.ready = false;

            if (this._filter.test(possibleGuest.person)) {
              this._index++;

              return possibleGuest.person;
            }
          }
          this._index++;
        }

        this._levelUp();
      }

      return null;
    },
    next() {
      const result = this._currentGuest;
      this._currentGuest = this._findNext();

      return result;
    },
    done() {
      return this._done;
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
// const LimitedIterator = createExtension(
//   Iterator,
//   function(friends, filter, maxLevel) {
//     Iterator.call(this, friends, filter);
//
//     this.maxLevel = maxLevel;
//   },
//   {
//     _init() {
//       Iterator.prototype._init.call(this);
//       this._done = this.level > this.maxLevel;
//     },
//     _levelUp() {
//       this.level++;
//
//       if (this.level <= this.maxLevel) {
//         Iterator.prototype._levelUp.call(this);
//       } else {
//         this._done = true;
//       }
//     },
//     next() {
//       return this.level > this.maxLevel ? null : Iterator.prototype.next.call(this);
//     },
//     done() {
//       return Iterator.prototype.done.call(this) || this.level > this.maxLevel;
//     }
//   }
// );
const LimitedIterator = function(friends, filter, maxLevel) {
  return new Iterator(friends, filter, maxLevel);
};

module.exports = {
  Iterator,
  LimitedIterator,
  Filter,
  MaleFilter,
  FemaleFilter
};
