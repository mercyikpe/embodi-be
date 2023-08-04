const Disease = require('../models/Disease');
const Questionnaire = require('../models/Questionnaire')



 
// Create a new disease
const createDiseases = async (req, res) => {
  try {
    const { title, category, photo,  detailTitle, detail } = req.body;
    //const userId = req.user.id; // Assuming the user ID is available in req.user.id

    // Create the disease object with user ID
    const diseaseData = {
      title,
      category,
      photo,
      detailTitle,
      detail,
      ////// when loggin, picke user id on the active session///// change this when pushig to git
      /*user: userId,*/ // Assign the user ID to the 'user' field
    };

    const disease = new Disease(diseaseData);
    await disease.save();

    return res.status(201).json({
      status: 'success',
      message: 'Disease created successfully.',
      data: disease,
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.user === 1) {
      return res.status(400).json({
        status: 'failed',
        message: 'Disease with the same user already exists.',
      });
    }
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while creating the disease.',
    });
  }
};


// Get all diseases 

const getDiseases = async (req, res) => {
  try {
    const diseases = await Disease.find();
    return res.status(200).json({
      status: 'success',
      message: 'Diseases fetched successfully.',
      data: diseases,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while fetching diseases.',
    });
  }
};



// Function to find diseases with at least 100 views per week
const getPopularDiseases = async (req, res) => {
  try {
    const ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
    const cutoffDate = new Date(Date.now() - ONE_WEEK_IN_MS); // Calculate the date one week ago

    const popularDiseases = await Disease.find({ views: { $gte: 100 }, createdAt: { $gte: cutoffDate } });
    const totalViews = popularDiseases.reduce((acc, disease) => acc + disease.views, 0);

    return res.status(200).json({
      status: 'success',
      message: 'Popular diseases fetched successfully.',
      totalViews: totalViews,
      popularDiseases: popularDiseases,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while fetching popular diseases.',
    });
  }
};

// Function to find the disease with the highest engagement
const getDiseaseWithHighestEngagement = async (req, res) => {
  try {
    const highestEngagementDisease = await Disease.findOne().sort('-engagement');

    return res.status(200).json({
      status: 'success',
      message: 'Disease with highest engagement fetched successfully.',
      highestEngagement: highestEngagementDisease ? highestEngagementDisease.engagement : 0,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while fetching disease with highest engagement.',
    });
  }
};

// controllers/diseaseController.js

const updateDisease = async (req, res) => {
  try {
    const { diseaseId } = req.params;
    const { title, category, detailTitle, detail } = req.body;

    // Find the disease by ID
    const disease = await Disease.findById(diseaseId);

    // Check if the disease exists
    if (!disease) {
      return res.status(404).json({
        status: 'failed',
        message: 'Disease not found. Please enter a valid diseaseId.',
      });
    }

    // Update the disease properties with new data
    disease.title = title;
    disease.category = category;
    disease.detailTitle = detailTitle;
    disease.detail = detail;

    // Save the updated disease to the database
    const updatedDisease = await disease.save();

    return res.status(200).json({
      status: 'success',
      message: 'Disease updated successfully.',
      data: updatedDisease,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while updating the disease.',
    });
  }
};


/////GET ALL DISEASE ALONGSIDE QUESTINNAIRE
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Correct usage of ObjectId with 'new' keyword
//const objectId = new ObjectId();
//console.log(objectId); // Should print a new ObjectId


const viewQuestionnaireWithDisease = async (req, res) => {
  try {
    const { diseaseId } = req.body;

    // Convert the diseaseId to a valid ObjectId
    const validDiseaseId = new mongoose.Types.ObjectId(diseaseId);

    // Query the Questionnaire model with the valid ObjectId
    const questionnaires = await Questionnaire.find({ diseaseId: validDiseaseId });

    // Rest of the code...
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while fetching questionnaires for the disease.',
    });
  }
};


module.exports = {
  createDiseases,
  updateDisease,
  getDiseases,
  getPopularDiseases,
  getDiseaseWithHighestEngagement,
  viewQuestionnaireWithDisease
    
};
