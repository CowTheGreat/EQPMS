import React, { useState, useEffect } from "react";

const AccessQP = () => {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8080/list-files") // Change port if using FastAPI
      .then((response) => response.json())
      .then((data) => setFiles(data.files))
      .catch((error) => console.error("Error fetching files:", error));
  }, []);

  const downloadFile = (url, name) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-4">Files</h2>
      <ul className="space-y-3">
        {files.map((file, index) => (
          <li
            key={index}
            className="flex justify-between items-center p-2 border rounded-lg shadow-sm"
          >
            <span>{file.name}</span>
            <button
              onClick={() => downloadFile(file.url, file.name)}
              className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600"
            >
              Download
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AccessQP;
