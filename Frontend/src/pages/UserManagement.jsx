import { useState } from "react";
import AddUser from "../components/AddUser/AddUser";
import DeleteUser from "../components/DeleteUser/DeleteUser";

const Button = ({ onClick, children, className }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-white rounded ${className}`}
  >
    {children}
  </button>
);

const Card = ({ children }) => (
  <div className="border rounded-lg shadow-md p-4">{children}</div>
);

const ModifyUser = () => <div>Modify User Component</div>;

const UserManagement = () => {
  const [selectedAction, setSelectedAction] = useState(null);

  const renderComponent = () => {
    switch (selectedAction) {
      case "add":
        return <AddUser />;
      case "delete":
        return <DeleteUser />;
      case "modify":
        return <ModifyUser />;
      default:
        return <div>Select an action</div>;
    }
  };

  return (
    <div className="p-4">
      <div className="flex space-x-2 mb-4">
        <Button
          onClick={() => setSelectedAction("add")}
          className="bg-blue-500"
        >
          Add User
        </Button>
        <Button
          onClick={() => setSelectedAction("delete")}
          className="bg-red-500"
        >
          Delete User
        </Button>
        <Button
          onClick={() => setSelectedAction("modify")}
          className="bg-green-500"
        >
          Modify User
        </Button>
      </div>
      <Card>{renderComponent()}</Card>
    </div>
  );
};

export default UserManagement;
