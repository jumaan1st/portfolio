import React from 'react';
import './Navbar.css';

type NavbarProps = {
    name: string;
}


const Navbar: React.FC<NavbarProps> = (NavbarProps) => {

    return (
        <>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=north_east" />
            <nav className={"primary"}>
                <div className='name'>
                    <h1 >{NavbarProps.name}</h1>
                </div>
                <div className='links'>
                    <h1><a className='anchor' href="">Home</a></h1>
                    <h1><a className='anchor' href="">Services</a></h1>
                    <h1><a className='anchor' href="">Works</a></h1>
                    <h1><a className='anchor' href="">Testimonial</a></h1>
                </div>
                <div className='icon'>
                    <h1><a href=""><button className='chat'>Ping Me</button></a></h1>
                </div>
            </nav>
        </>
    )
}

export default Navbar;