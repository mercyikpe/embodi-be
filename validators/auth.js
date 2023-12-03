const { check } = require("express-validator");

// firstName, lastName, email, phoneNumber

const authValidator = [
  check("firstName")
    .trim()
    // .notEmpty()
    // .withMessage("First Name is missing")
    .isLength({ min: 3 })
    .withMessage("First Name must have at least 2 characters")
    .isLength({ max: 31 })
    .withMessage("First Name can have a maximum of 31 characters"),

  check("lastName")
    .trim()
    // .notEmpty()
    // .withMessage("Last Name is missing")
    .isLength({ min: 3 })
    .withMessage("Last Name must have at least 2 characters")
    .isLength({ max: 31 })
    .withMessage("Last Name can have a maximum of 31 characters"),

  // check("phoneNumber").notEmpty().withMessage("Phone Number is missing"),

  check("email")
    // .trim()
    // .notEmpty()
    // .withMessage("Email is missing")
    .isEmail()
    .withMessage("Not a valid email"),

  check("password")
    // .notEmpty()
    // .withMessage("Password is missing")
    .isLength({ min: 6 })
    .withMessage("Password must have at least 6 characters"),
];

module.exports = {
  authValidator,
};
