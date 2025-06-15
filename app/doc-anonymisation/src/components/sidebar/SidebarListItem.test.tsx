import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SidebarListItem from './SidebarListItem';

describe('SidebarListItem', () => {
  const mockProps = {
    id: 'job-123',
    date: 'April 14 3:53 pm',
    documents: 5,
  };

  const mockActionButton = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders job information correctly', () => {
    render(
      <SidebarListItem
        {...mockProps}
        actionButton={mockActionButton}
      />
    );

    expect(screen.getByText('job-123 - April 14 3:53 pm - 5 documents')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument();
  });

  it('calls actionButton when view button is clicked', () => {
    render(
      <SidebarListItem
        {...mockProps}
        actionButton={mockActionButton}
      />
    );

    const viewButton = screen.getByRole('button', { name: 'View' });
    fireEvent.click(viewButton);

    expect(mockActionButton).toHaveBeenCalledTimes(1);
  });

  it('handles single document correctly', () => {
    render(
      <SidebarListItem
        id="job-456"
        date="May 1 2:30 pm"
        documents={1}
        actionButton={mockActionButton}
      />
    );

    expect(screen.getByText('job-456 - May 1 2:30 pm - 1 documents')).toBeInTheDocument();
  });

    it('handles multiple documents correctly', () => {
    render(
      <SidebarListItem
        id="job-789"
        date="May 2 4:20 pm"
        documents={12}
        actionButton={mockActionButton}
      />
    );

    expect(screen.getByText('job-789 - May 2 4:20 pm - 12 documents')).toBeInTheDocument();
  });

});