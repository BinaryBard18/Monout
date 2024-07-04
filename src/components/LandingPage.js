import React, { useContext, useState } from "react";
import { auth,googleAuthProvider} from "../Firebase/firebase";
import { signInWithPopup } from "firebase/auth"; 
import { db } from "../Firebase/firebase";
import { collection, getDocs } from "firebase/firestore";
import AppContext from "../context/AppContext";
import "../LandingPage.css"
import lastTransactionImage from "../imagesCollage/LatestTransaction.png"
import limtsByTransaction from "../imagesCollage/limitsByTransacttion.png"
import AnalysisChart from "../imagesCollage/AnalysisChart.png"
import TotalExpenses from "../imagesCollage/totalExpense.png"
import revenue from "../imagesCollage/Revenue.png"
import { useNavigate } from "react-router-dom";
import { addDoc } from "firebase/firestore";
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

export default function LandingPage(){

    const {
            nameOfUser,
            setNameOfUser,
            imageURL,
            setImageURL,
            styler,
            setStyler,
            showLandingModal,
            setShowLandingModal,
            greet,
            setGreet
            } = useContext(AppContext);

    const [showBackDrop,setShowBackDrop] = useState(null);
    

    const navigation = useNavigate();
    async function SignIn(){
        try{
            
            const result = await signInWithPopup(auth,googleAuthProvider); 
            
            navigation('/dashboard');
            localStorage.setItem("LandingModalValue",true);
            localStorage.setItem("token",JSON.stringify(result.user.accessToken))
            localStorage.setItem("user",JSON.stringify(result.user));
            
            console.log(result);            
            await CheckIfUserAlreadyRegistered(result);
            const name = result.user.displayName;
            setNameOfUser(name);
            localStorage.setItem("userName",JSON.stringify(name));
            
            const url = result.user.photoURL;
            setImageURL(url);
            localStorage.setItem("userPhoto",JSON.stringify(url));
            localStorage.setItem("UID",JSON.stringify(result.user.uid));

            localStorage.setItem("activeLink","/dashboard");
        }catch(error){
            console.log(error);
        }
    }

    async function StoreToDB(res){
        try{
            await addDoc(collection(db, 'users'), {
                uid : res.user.uid,
                name: res.user.displayName,
                email:res.user.email,
                photoLink:res.user.photoURL,
            });

        }catch(error){
            console.log("Trouble pushing data : ",error)
        }
    }

    async function CheckIfUserAlreadyRegistered(res){
        const userCollection = collection(db,'users');
        let isPresent = false;
        try{
            setShowBackDrop(true);
            const allDocs = await getDocs(userCollection);
            allDocs.forEach((doc)=>{
                if(doc.data().uid===res.user.uid){
                    isPresent=true;
                    setShowLandingModal(false);
                    localStorage.removeItem("LandingModalValue");
                    setShowBackDrop(null);

                }
            })
            if(isPresent===true) return;
            else{
                StoreToDB(res);
                setShowBackDrop(null);
                setShowLandingModal(true);
                setGreet(true);
            }
        }catch(error){
            console.log("Some error occured : ",error);
        }
    }

    return(
        <div className="parent--div--landing--page">
            <Backdrop
                    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                    open={showBackDrop}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
            <div className="nav--div">
                <p className="name--logo">MONOUT</p>
                <div className="login--signUp--button">
                    <button type="button" className="signUp--button"  onClick={()=>SignIn()}><span></span>Sign In</button>
                </div>
            </div>
            <div className="main--body">
                <div className="left--text--div">
                    <p className="text">manage your expense easily with <span>MONOUT</span></p>
                    <div className="text--description--wrapper">
                        <p className="text--description">
                            "Discover MONOUT, the ultimate tool
                            for effortless expense tracking and
                            smart budgeting. Simplify your finances,
                            achieve your goals, and take control of
                            your financial future today with our
                            intuitive and powerful platform."
                        </p>
                    </div>
                </div>
                <div className="right--side--collage">
                    <div className="image--div">
                        <img className="lastTransaction" src={lastTransactionImage}></img>
                        <img className="limtsByTransaction" src={limtsByTransaction}></img>
                        <img className="analysisChart" src={AnalysisChart}></img>
                        <img className="TotalExpenses" src={TotalExpenses}></img>
                        <img className="revenue" src={revenue}></img>
                    </div>
                </div>
            </div>
            {/* <button type="button" onClick={()=>OpenMenu()}>Click me</button> */}
        </div>
    )
}