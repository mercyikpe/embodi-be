const Disease = require('../models/Disease');


// Create a new disease
async function createDisease(documentData) {
  // Validate the document data
  const errors = validateDocumentData(documentData);
  if (errors.length) {
    throw new Error(errors.join(', '));
  }

  // Create a new Disease document
  const disease = new Disease({
    title: documentData.title,
    category: documentData.category,
    photo: documentData.photo,
    detailTitle: documentData.detailTitle,
    detail: documentData.detail,
  });

  // Save the new Disease document to the database
  try {
    await disease.save();
  } catch (error) {
    console.error('Error creating disease:', error);
    throw new Error('An error occurred while creating the disease.');
  }

  return disease;
}

function validateDocumentData(documentData) {
  const errors = [];

  if (!documentData.title) {
    errors.push('Title is required.');
  }

  if (!documentData.category) {
    errors.push('Category is required.');
  }

  return errors;
}
  
  // Update a disease
  function updateDisease(diseaseId, diseaseData) {
    const disease = Disease.findById(diseaseId);
    disease.update(diseaseData);
    disease.save();
    return disease;
  }
  
  // Delete a disease
  function deleteDisease(diseaseId) {
    Disease.deleteOne({ _id: diseaseId });
  }
  
  // View a disease
  function viewDisease(diseaseId) {
    const disease = Disease.findById(diseaseId);
    return disease;
  }
  
  // Make a disease popular
  function makeDiseasePopular(diseaseId) {
    const disease = Disease.findById(diseaseId);
    disease.popular = true;
    disease.save();
    return disease;
  }
  



// Create a new disease
async function createDiseases(req, res) {
  try {
    const diseaseData = req.body;
    const disease = new Disease(diseaseData);
    await disease.save();
    return res.status(201).json({
      status: 'success',
      message: 'Disease created successfully.',
      data: disease,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while creating the disease.',
    });
  }
}



// Update a disease
async function updateDisease(req, res) {
  try {
    const diseaseId = req.params.id;
    const diseaseData = req.body;
    const disease = await Disease.findByIdAndUpdate(diseaseId, diseaseData, {
      new: true,
    });
    return res.status(200).json({
      status: 'success',
      message: 'Disease updated successfully.',
      data: disease,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while updating the disease.',
    });
  }
}

/*

// Delete a disease
async function deleteDisease(req, res) {
  try {
    const diseaseId = req.params.id;
    await Disease.findByIdAndDelete(diseaseId);
    return res.status(200).json({
      status: 'success',
      message: 'Disease deleted successfully.',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while deleting the disease.',
    });
  }
}

// View a disease
async function viewDisease(req, res) {
  try {
    const diseaseId = req.params.id;
    const disease = await Disease.findById(diseaseId);
    if (!disease) {
      return res.status(404).json({
        status: 'failed',
        message: 'Disease not found.',
      });
    }
    return res.status(200).json({
      status: 'success',
      data: disease,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while fetching the disease.',
    });
  }
}

// View diseases by categories
async function viewDiseasesByCategory(req, res) {
  try {
    const category = req.params.category;
    const diseases = await Disease.find({ category });
    return res.status(200).json({
      status: 'success',
      data: diseases,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while fetching diseases by category.',
    });
  }
}

// Set popularity if it has 20 views
async function setPopularity(diseaseId) {
  try {
    const disease = await Disease.findById(diseaseId);
    if (disease) {
      if (disease.views >= 20 && !disease.popular) {
        disease.popular = true;
        await disease.save();
      }
    }
  } catch (error) {
    console.log(error);
  }
}

// View diseases by popularity
async function viewDiseasesByPopularity(req, res) {
  try {
    const diseases = await Disease.find({ popular: true });
    return res.status(200).json({
      status: 'success',
      data: diseases,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'failed',
      message: 'An error occurred while fetching popular diseases.',
    });
  }
}

*/

module.exports = {
createDiseases,
createDisease,
updateDisease,
deleteDisease,
viewDisease,
makeDiseasePopular
    /*
  createDisease,
  updateDisease,
  deleteDisease,
  viewDisease,
  viewDiseasesByCategory,
  setPopularity,
  viewDiseasesByPopularity,
  */
};
