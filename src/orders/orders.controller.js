const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function allFields(req, res, next) {
  const { data: { deliverTo } = {} } = req.body;
  const { data: { mobileNumber } = {} } = req.body;
  const { data: { status } = {} } = req.body;
  const { data: { dishes } = [] } = req.body;
  const toCompare = ["deliverTo", "mobileNumber", "status", "dishes"];
  if (
    deliverTo &&
    mobileNumber &&
    dishes &&
    dishes.length > 0 &&
    Array.isArray(dishes)
  ) {
    res.locals.deliver = deliverTo;
    res.locals.mobile = mobileNumber;
    res.locals.status = status;
    res.locals.dishes = dishes;
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

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `No order with ${orderId}`,
  });
}

function quantityCheck(req, res, next) {
  const dishes = res.locals.dishes;
  for (let dish = 0; dish < dishes.length; dish++) {
    if (
      !dishes[dish].quantity ||
      typeof dishes[dish].quantity != "number" ||
      dishes[dish].quantity <= 0
    ) {
      return next({
        status: 400,
        message: `No quantity: ${dish} listed`,
      });
    }
  }
  next();
}

function checkId(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;
  if (orderId && id) {
    if (id !== orderId) {
      return next({
        status: 400,
        message: `No order with id: ${id}`,
      });
    }
  }
  next();
}

function checkStatus(req, res, next) {
  if (res.locals.status && res.locals.status !== "invalid") {
    return next();
  }
  next({
    status: 400,
    message: "status",
  });
}

function checkPend(req, res, next) {
  if (res.locals.order.status === "pending") {
    return next();
  }
  next({
    status: 400,
    message: "pending",
  });
}

function create(req, res, next) {
  const newOrder = {
    id: { nextId },
    deliverTo: res.locals.deliver,
    mobileNumber: res.locals.mobile,
    status: res.locals.status,
    dishes: res.locals.dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function list(req, res, next) {
  res.json({ data: orders });
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

function update(req, res, next) {
  const { data: { deliverTo } = {} } = req.body;
  res.locals.order.deliverTo = deliverTo;
  res.json({ data: res.locals.order });
}

function destroy(req, res, next) {
  const { orderId } = req.params;
  const foundIndex = orders.indexOf((order) => order.id === orderId);
  orders.splice(foundIndex, 1);
  res.sendStatus(204);
}

module.exports = {
  create: [allFields, quantityCheck, create],
  list,
  read: [orderExists, read],
  update: [orderExists, checkId, allFields, quantityCheck, checkStatus, update],
  delete: [orderExists, checkPend, destroy],
};