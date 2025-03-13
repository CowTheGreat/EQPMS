import React, { useState } from "react";
import AddSubjects from "../components/AddSubjects/AddSubjects";
import DeleteSubject from "../components/DeleteSubject/DeleteSubject";
import AlterDeadline from "../components/AlterDeadline/AlterDeadline";
import ModifyPaper from "../components/ModifyPaper/ModifyPaper";
import UnlockAllPapers from "../components/UnlockAllPapers/UnlockAllPapers";

const DatabaseManager = () => {
  const [selectedAction, setSelectedAction] = useState(null);

  const renderComponent = () => {
    switch (selectedAction) {
      case "add":
        return <AddSubjects />;
      case "delete":
        return <DeleteSubject />;
      case "deadline":
        return <AlterDeadline />;
      case "modify":
        return <ModifyPaper />;
      case "unlock":
        return <UnlockAllPapers />;
      default:
        return <div>Select an action</div>;
    }
  };

  return (
    <div className="p-4">
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setSelectedAction("add")}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Add Subject
        </button>
        <button
          onClick={() => setSelectedAction("delete")}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Delete Subject
        </button>
        <button
          onClick={() => setSelectedAction("deadline")}
          className="px-4 py-2 bg-yellow-500 text-white rounded"
        >
          Alter Deadline
        </button>
        <button
          onClick={() => setSelectedAction("modify")}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Modify Paper
        </button>
        <button
          onClick={() => setSelectedAction("unlock")}
          className="px-4 py-2 bg-purple-500 text-white rounded"
        >
          Unlock All Papers
        </button>
      </div>
      <div className="border p-4 rounded">{renderComponent()}</div>
    </div>
  );
};

export default DatabaseManager;
