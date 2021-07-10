define(function() {
	"use strict";
	
	function Collection(items = [])
	{
		this._items = items;
	}
	
	Collection.prototype.all = function()
	{
		return this._items;
	};
	
	Collection.prototype.join = function(delim = ', ')
	{
		return this._items.join(delim);
	};
	
	Collection.prototype.count = function()
	{
		return this._items.length;
	};
	
	Collection.prototype.sum = function(key)
	{
		let sum = 0;
		this.each(function(item) {
			let it = +item[key];
			if (!isNaN(it)) {
				sum+= it;
			}
		});
		return sum;
	};
	
	Collection.prototype.first = function()
	{
		return this.get(0);
	};
	
	Collection.prototype.last = function()
	{
		return this._items[this.count()-1];
	};
	
	Collection.prototype.get = function(ind)
	{
		return this._items[ind] ? this._items[ind] : null;
	};
	
	Collection.prototype.key = function(item)
	{
		return this._items.indexOf(item);
	};
	
	Collection.prototype.find = function(key, val)
	{
		let finded = new Collection();
		this.each(function(item) {
			if (item[key] == val) {
				finded.push(item);
			}
		});
		return finded;
	};
	
	Collection.prototype.filter = function(callback)
	{
		let filtered = new Collection();
		this.each(function(item){
			if (callback(item)) {
				filtered.push(item);
			}
		});
		return filtered;
	};
	
	Collection.prototype.transform = function(callback)
	{
		let transformed = new Collection();
		this.each(function(item) {
			transformed.push(callback(item));
		});
		return transformed;
	};
	
	Collection.prototype.sort = function(callback)
	{
		this._items.sort(callback);
		return this;
	};
	
	Collection.prototype.sortBy = function(field, type = 'desc')
	{
		this._items.sort(function(a, b) {
			if (a[field] != 'undefined' || b[field] != 'undefined') {
				if (type.toLocaleLowerCase() == 'asc') {
					return a[field] > b[field]? 1 : -1;
				} else {
					return a[field] < b[field] ? 1 : -1;
				}
			}
		});
		return this;
	};
	
	Collection.prototype.push = function(element)
	{
		this._items.push(element); 
	};
	
	Collection.prototype.each = function(callback)
	{
		this._items.forEach(callback);
	};
	
	Collection.prototype.min = function(field, val = 0)
	{
		this._items.forEach(function(item) {
			if (item[field] != 'undefined' && item[field] < val) {
				val = item[field];
			}
		});
		return val;
	};
	
	Collection.prototype.max = function(field, val = 0)
	{
		this._items.forEach(function(item) {
			if (item[field] != 'undefined' && item[field] > val) {
				val = item[field];
			}
		});
		return val;
	};
	
	Collection.prototype.replace = function(from, to)
	{
		let key = this.key(from);
		if (key > -1) {
			this._items[key] = to;
			return this._items[key];
		}
		return false;
	};
	
	Collection.prototype.remove = function(elem)
	{
		let key = isNaN(elem) ? this.key(elem) : elem;
		if (key > -1) {
			return this._items.splice(key, 1);
		}
		return false;
	};
	
	return Collection;
});

	