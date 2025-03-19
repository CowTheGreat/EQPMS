import { useState } from "react";
import AddUser from "../components/AddUser/AddUser";
import DeleteUser from "../components/DeleteUser/DeleteUser";
import ModifyUser from "../components/ModifyUser/ModifyUser";
import BlacklistManagement from "../components/BlacklistManagement/BlacklistManagement";
import styles from "../page_styles/UserManagement.module.css";

const Button = ({ onClick, children, className }) => (
  <button onClick={onClick} className={`${styles.actionButton} ${className}`}>
    {children}
  </button>
);

const Card = ({ children }) => (
  <div className={styles.cardContainer}>{children}</div>
);

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
      case "blacklist":
        return <BlacklistManagement />;
      default:
        return <div>Select an action</div>;
    }
  };

  return (
    <div className={styles.userManagementContainer}>
      <h1 className={styles.managementHeading}>User Management</h1>

      <div className={styles.actionButtons}>
        <Button
          onClick={() => setSelectedAction("add")}
          className={styles.addButton}
        >
          Add User
        </Button>
        <Button
          onClick={() => setSelectedAction("delete")}
          className={styles.deleteButton}
        >
          Delete User
        </Button>
        <Button
          onClick={() => setSelectedAction("modify")}
          className={styles.modifyButton}
        >
          Modify User
        </Button>
        <Button
          onClick={() => setSelectedAction("blacklist")}
          className={styles.blacklistButton}
        >
          Blacklist Management
        </Button>
      </div>

      <Card>{renderComponent()}</Card>
    </div>
  );
};

export default UserManagement;
