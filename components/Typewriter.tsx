"use client";

import React, { useEffect, useState } from "react";

type Props = {
    words: string[];
    delay?: number;
};

export const Typewriter: React.FC<Props> = ({ words, delay = 3000 }) => {
    const [index, setIndex] = useState(0);
    const [subIndex, setSubIndex] = useState(0);
    const [reverse, setReverse] = useState(false);
    const [blink, setBlink] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => setBlink((b) => !b), 500);
        return () => clearTimeout(t);
    }, [blink]);

    useEffect(() => {
        if (!words.length) return;
        if (subIndex === words[index].length + 1 && !reverse) {
            setTimeout(() => setReverse(true), delay);
            return;
        }
        if (subIndex === 0 && reverse) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setReverse(false);
            setIndex((prev) => (prev + 1) % words.length);
            return;
        }

        const t = setTimeout(
            () => {
                setSubIndex((prev) => prev + (reverse ? -1 : 1));
            },
            Math.max(
                reverse ? 75 : subIndex === words[index].length ? 1000 : 150,
                parseInt(String(Math.random() * 350))
            )
        );

        return () => clearTimeout(t);
    }, [subIndex, index, reverse, words, delay]);

    return (
        <span className="font-mono">
            {words[index]?.substring(0, subIndex)}
            <span className={`${blink ? "opacity-100" : "opacity-0"} text-blue-500`}>
                |
            </span>
        </span>
    );
};
