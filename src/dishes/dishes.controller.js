const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function allFields(req, res, next) {
  const { data: { name } = {} } = req.body;
  const { data: { description } = {} } = req.body;
  const { data: { price } = {} } = req.body;
  const { data: { image_url } = {} } = req.body;
  const toCompare = ["description", "name", "image_url", "price"];
  if (
    price &&
    name &&
    description &&
    image_url &&
    price > 0 &&
    typeof price == "number"
  ) {
    res.locals.name = name;
    res.locals.description = description;
    res.locals.price = price;
    res.locals.image_url = image_url;
    return next();
  }
  const missingKey = toCompare.filter((compare) => {
    const checkData = Object.keys(req.body.data);
    for (var each in req.body.data) {
      if (
        req.body.data[each] === "" ||
        req.body.data[each] <= 0 ||
        req.body.data[each] !== "number"
      ) {
        return each;
      }
    }
    return !checkData.includes(compare);
  });
  next({
    status: 400,
    message: `${missingKey}`,
  });
}

function checkId(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;
  if (dishId && id) {
    if (id !== dishId) {
      return next({
        status: 400,
        message: `No dish with id: ${id}`,
      });
    }
  }
  next();
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `No dish with ${dishId}`,
  });
}

function create(req, res, next) {
  const newDish = {
    id: { nextId },
    name: res.locals.name,
    description: res.locals.description,
    price: res.locals.price,
    image_url: res.locals.image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function list(req, res, next) {
  res.json({ data: dishes });
}

function read(req, res, next) {
  res.json({ data: res.locals.dish });
}

function update(req, res, next) {
  const { data: { name } = {} } = req.body;
  const { data: { description } = {} } = req.body;
  res.locals.dish.description = description;
  res.locals.dish.name = name;
  res.json({ data: res.locals.dish });
}

module.exports = {
  create: [allFields, create],
  list,
  read: [dishExists, read],
  update: [dishExists, checkId, allFields, update],
};