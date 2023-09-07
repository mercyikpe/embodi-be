// Function to capitalize the first letter of each word in a string
function capitalizeWords(str) {
    return str.replace(/\b\w/g, (match) => match.toUpperCase());
}

// Export the capitalizeWords function to make it accessible in other modules
module.exports = {
    capitalizeWords,
};