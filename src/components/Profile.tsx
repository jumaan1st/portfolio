import React from "react";
import "./Profile.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook } from "@fortawesome/free-brands-svg-icons"; // Import the specific icon
import { faInstagram } from "@fortawesome/free-brands-svg-icons"; // Import the specific icon
import { faXTwitter } from "@fortawesome/free-brands-svg-icons"; // Import the specific icon
import { faLinkedin } from "@fortawesome/free-brands-svg-icons"; // Import the specific icon
import img from "../assets/images/img.png";

type ProfileProps = {
    name: string;
};

const Profile: React.FC<ProfileProps> = (ProfileProps) => {
    return (
        <>
            <div className="profile primary">

                <div className="profile-info">
                    <span className="profile-title">SOFTWARE DEVELOPER</span>
                    <div className="profile-content">
                        <h1 className="profile-name">{ProfileProps.name}</h1>
                        <p className="profile-description">
                            Computer Science student skilled in Python, JavaScript, and web development.
                            I build innovative solutions like AI Code Converter and Skin Cancer Detection
                            using modern tech. Passionate about impactful, collaborative projects.
                        </p>
                    </div>
                </div>

                <div className="profile-image">
                    <img src={img} alt={ProfileProps.name + '-img'} className="profile-img" />
                </div>

                <div className="profile-social">
                    <div className="follow-me">
                        <h4>Follow Me</h4>
                        <p className="social-icons"> <FontAwesomeIcon icon={faFacebook} /> <FontAwesomeIcon icon={faInstagram} /> <FontAwesomeIcon icon={faXTwitter} /><FontAwesomeIcon icon={faLinkedin} /></p>
                    </div>
                    <div className="profile-skills">
                        FULL STACK CODER
                    </div>
                </div>
            </div>
        </>
    );
};
export default Profile;