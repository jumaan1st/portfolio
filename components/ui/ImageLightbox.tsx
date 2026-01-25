"use client";

import React from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

interface ImageLightboxProps {
    isOpen: boolean;
    close: () => void;
    src: string;
    alt?: string;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ isOpen, close, src, alt }) => {
    return (
        <Lightbox
            open={isOpen}
            close={close}
            slides={[{ src, alt }]}
            styles={{ container: { backgroundColor: "rgba(0, 0, 0, .9)" } }}
        />
    );
};
