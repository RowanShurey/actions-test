import "./SidebarListItem.css";

interface SidebarListItemProps {
  id: string;
  date: string;
  documents: number;
  actionButton?: () => void;
}

function SidebarListItem({ id, date, documents, actionButton }: SidebarListItemProps) {
  return (
    <div className="sidebar-list-item">
      <span className="sidebar-list-item-text">
        {id} - {date} - {documents} documents
      </span>
      <button className="view-button" onClick={actionButton}>View</button>
    </div>
  );
}

export default SidebarListItem;
