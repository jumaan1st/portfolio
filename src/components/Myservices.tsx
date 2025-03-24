import React from 'react';
import './Myservices.css';

const MyServices: React.FC = () => {
    return (
        <div className="MyServices">
            <h1>My Services</h1>
            <div className="services">
                <div className="service">
                    <img src="src/assets/images/fullstack.jpeg" alt="full-stack" />
                    <div className="overlay">
                        <button>SEE DETAILS</button>
                    </div>
                    <h2>Full Stack Development</h2>
                    <p>Full stack development refers to the development of both front end and back end portions of an application. This web development process involves all three layers of a typical web application—presentation layer, business logic layer and the database layer.</p>
                </div>
                <div className="service">
                    <img src="src/assets/images/api.jpeg" alt="full-stack" />
                    <div className="overlay">
                        <button>SEE DETAILS</button>
                    </div>
                    <h2>API Development & Integration</h2>
                    <p>API development and integration involves the creation of web services that enable communication between different software components, systems, and applications.</p>
                </div>
                <div className="service">
                    <img src="src/assets/images/optimization.jpeg" alt="full-stack" />
                    <div className="overlay">
                        <button>SEE DETAILS</button>
                    </div>
                    <h2>Web Application Optimization & Debugging</h2>
                    <p>Web application optimization and debugging refers to the process of identifying and resolving performance issues, bugs, and other issues in a web application.</p>
                </div>
            </div>
        </div>
    );
}

export default MyServices;