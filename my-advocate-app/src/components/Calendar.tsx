import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useNavigate } from 'react-router-dom';

interface CalendarProps {
    onLogout: () => void;
}

const CalendarComponent: React.FC<CalendarProps> = ({ onLogout }) => {
    const navigate = useNavigate();
    const [value, setValue] = React.useState<Date>(new Date());

    const handleDayClick = (value: any, event: React.MouseEvent<HTMLButtonElement>) => {
        if (value instanceof Date) {
            setValue(value);
            // You can add logic here to navigate to specific events or appointments for the selected date
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Calendar</h2>
                <button 
                    onClick={onLogout}
                    className="text-sm text-gray-600 hover:text-gray-800"
                >
                    Sign Out
                </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
                <Calendar
                    value={value}
                    onChange={handleDayClick}
                    onClickDay={handleDayClick}
                    className="w-full"
                />
            </div>

            {/* Add a button to create new appointments */}
            <div className="mt-4">
                <button
                    onClick={() => navigate('/appointments/new')}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Schedule New Appointment
                </button>
            </div>
        </div>
    );
};

export default CalendarComponent;
