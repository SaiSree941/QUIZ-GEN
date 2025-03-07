const { default: axiosInstance } = require(".");

// Add Exam
export const addExam = async (payload) => {
  try {
    const response = await axiosInstance.post("/api/exams/add", payload, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Generate Quiz with AI
export const generateQuiz = async (payload) => {
  try {
    const response = await axiosInstance.post("/api/exams/generate-quiz", payload, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get All Exams
export const getAllExams = async () => {
  try {
    const response = await axiosInstance.get("/api/exams/get-all-exams", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get Exam by ID
export const getExamById = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/exams/get-exam-by-id/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Edit Exam by ID
export const editExamById = async (payload) => {
  try {
    const response = await axiosInstance.put("/api/exams/edit-exam-by-id", payload, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Delete Exam by ID
export const deleteExamById = async (id) => {
  try {
    const response = await axiosInstance.delete(`/api/exams/delete-exam-by-id/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Add Question to Exam
export const addQuestionToExam = async (payload) => {
  try {
    const response = await axiosInstance.post("/api/exams/add-question-to-exam", payload, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Edit Question by ID
export const editQuestionById = async (payload) => {
  try {
    const response = await axiosInstance.put("/api/exams/edit-question-in-exam", payload, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Delete Question by ID
export const deleteQuestionById = async (id) => {
  try {
    const response = await axiosInstance.delete(`/api/exams/delete-question-in-exam/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};