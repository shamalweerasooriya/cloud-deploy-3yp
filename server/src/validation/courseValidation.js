/* Schema validation */
const Joi = require('@hapi/joi');

// course creation validation
const courseCreateValidation = (data) => {
    const schema = Joi.object({
        title: Joi.string().min(8).required(),
        description: Joi.string().min(3).required(),
        level: Joi.string().valid('Easy', 'Moderate', 'Hard').required(),
        isPublished: Joi.boolean().required(),
        numberOfLessons: Joi.number().required(),
        author: Joi.string().required(),
        noOfStudents: Joi.number().required(),
        category: Joi.string(),
        searchTags: Joi.array().items(Joi.string()),
        lessons: Joi.array().items(Joi.string()),
        requirements: Joi.array().items(Joi.string()),
        amount: Joi.number()
    });

    const { error } = schema.validate(data);
    return error;
};

module.exports = {
    courseCreateValidation
};