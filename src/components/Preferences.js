import React, { useContext, useState, useEffect } from "react"; 
import "../Preferences.css"
import "../LimitByCategoryModal.css"
import AppContext from "../context/AppContext";
import DeleteWalletConfirmation from "./DeleteWalletConfirmation";
import { useParams } from "react-router-dom";
import { collection, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../Firebase/firebase';

export default function Preferences() {
    const { showDeleteWalletConfirmation, setShowDeleteWalletConfirmation, uid, setUid } = useContext(AppContext);
    const [showDefaultPopUp, setShowDefaultPopUp] = useState(false);
    const [name, setName] = useState(null);
    const [ID, setID] = useState(null);
    const { id } = useParams();

    function OpenPopUp() {
        setShowDefaultPopUp(true);
        setTimeout(() => {
            setShowDefaultPopUp(false);
        }, 7000);
    }

    useEffect(() => {
        const storedUid = JSON.parse(localStorage.getItem('UID'));
        if (storedUid) {
            setUid(storedUid);
        }
    }, [setUid]);

    async function ConfirmationPopUp() {
        if (!uid || !id) {
            console.log("Error: uid or id is undefined");
            return;
        }

        try {
            const q = query(collection(db, "wallets"), where('uid', '==', uid), where('id', '==', id));
            const allDocs = await getDocs(q);
            if (!allDocs.empty) {
                const document = allDocs.docs[0].data(); // Use .data() to access the document data
                setName(document.name);
                setID(document.id);
                console.log(document);
            }
        } catch (error) {
            console.log("Error occurred: ", error);
        }
        setShowDeleteWalletConfirmation(true);
    }

    const transitionPopUp = {
        hidden: {
            opacity: 0
        },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.3
            }
        },
        exit: {
            opacity: 0,
            transition: {
                duration: 0.3
            }
        }
    };

    async function CloseDefaultCategoryPopUp() {
        setShowDefaultPopUp(false);
    }

    return (
        <div className="preferences--parent--div">
            {showDeleteWalletConfirmation && <DeleteWalletConfirmation id={ID} name={name} />}
            <div className="preferences--title--div">
                <p className="preferences--title">Preferences</p>
            </div>
            <div className="delete--wallet--div">
                <button type="button" className="delete--wallet" onClick={ConfirmationPopUp}>Delete Wallet</button>
            </div>
        </div>
    );
}
