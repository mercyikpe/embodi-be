const Disease = require('../models/Disease');

// Create a new disease
async function createDisease(diseaseData) {
  const disease = new Disease(diseaseData);
  await disease.save();
  return disease;
}

// Update a disease
async function updateDisease(diseaseId, diseaseData) {
  const disease = await Disease.findByIdAndUpdate(diseaseId, diseaseData, { new: true });
  return disease;
}

// Delete a disease
async function deleteDisease(diseaseId) {
  await Disease.deleteOne({ _id: diseaseId });
}

// View a disease
async function viewDisease(diseaseId) {
  const disease = await Disease.findById(diseaseId);
  return disease;
}

// View diseases by title
async function viewDiseasesByTitle(title) {
  const diseases = await Disease.find({ title: title });
  return diseases;
}

// View diseases by popularity
async function viewDiseasesByPopularity() {
  const diseases = await Disease.find({ popular: true });
  return diseases;
}

// Make a disease popular
async function makeDiseasePopular(diseaseId) {
  const disease = await Disease.findByIdAndUpdate(diseaseId, { popular: true }, { new: true });
  return disease;
}

// Create a new questionnaire
async function createQuestionnaire(diseaseId, questionnaireData) {
  const disease = await Disease.findById(diseaseId);
  disease.questionnaire.push(questionnaireData);
  await disease.save();
  return disease.questionnaire[disease.questionnaire.length - 1];
}

// Update a questionnaire
async function updateQuestionnaire(questionnaireId, questionnaireData) {
  const disease = await Disease.findOneAndUpdate(
    { 'questionnaire._id': questionnaireId },
    { $set: { 'questionnaire.$': questionnaireData } },
    { new: true }
  );
  return disease;
}

// Delete a questionnaire
async function deleteQuestionnaire(questionnaireId) {
  const disease = await Disease.findOneAndUpdate(
    { 'questionnaire._id': questionnaireId },
    { $pull: { questionnaire: { _id: questionnaireId } } },
    { new: true }
  );
  return disease;
}

module.exports = {
  createDisease,
  updateDisease,
  deleteDisease,
  viewDisease,
  viewDiseasesByTitle,
  viewDiseasesByPopularity,
  makeDiseasePopular,
  createQuestionnaire,
  updateQuestionnaire,
  deleteQuestionnaire,
};
