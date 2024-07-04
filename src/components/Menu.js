import React,{useContext, useEffect, useState} from "react";
import { Link, useNavigate } from "react-router-dom";
import "../Menu.css";
import AppContext from "../context/AppContext";
import { collection, onSnapshot, query,where } from "firebase/firestore";
import { db } from "../Firebase/firebase";
import { AnimatePresence, motion } from "framer-motion";

export default function Menu(){

    const {showDashboard,
        setShowDashBoard,
        showSettings,
        setShowSettings,
        showWallets,
        setShowWallets,
        showCatogories,
        setShowCategories,
        showGiveFeeback,
        setShowGiveFeedback,
        showReportBug,
        setShowReportBug,
        styler,
        setStyler,
        uid,
        setUid,
        showAddWallet,
        setShowAddWallet
        }=useContext(AppContext);

    const [walletNameArray,setWalletNameArray] = useState([]);
    const [showDrop,setShowDrop] = useState(false);


    const DropDownVariants = {
        hidden:{
          height:0,
          opacity:0,
          overflow: 'hidden',
        },
        visible: {
          height: 'auto',
          opacity: 1,
          overflow: 'hidden',
          transition: {
            height: { duration: 0.2, ease: 'easeInOut' },
            opacity: { duration: 0.2, ease: 'easeInOut' },
          }
        },
        exit: {
          height: 0,
          opacity: 0,
          overflow: 'hidden',
          transition: {
            height: { duration: 0.2, ease: 'easeInOut' },
            opacity: { duration: 0.2, ease: 'easeInOut' },
          }
        }
      }

    const styleWhenLinkIsClicked = {
        backgroundColor : '#2d2d2edf'
    }
    const navigate = useNavigate('/');

    
    useEffect(()=>{
        const storedLink = localStorage.getItem('activeLink');
        if(storedLink){
            setStyler(storedLink);
        }
    },[])

    useEffect(() => {
        const storedUid = JSON.parse(localStorage.getItem('UID'));
    
        if (storedUid) {
          setUid(storedUid);
        }
      }, []);

    function updateActiveLink(link) {
        localStorage.setItem("activeLink", link);
        setStyler(link);
    }

    useEffect(()=>{
        if(!uid) return;
        WalletData(uid);
    },[uid])


    function DashBoardClicked(){
        navigate('/dashboard');
        updateActiveLink('/dashboard');
        localStorage.setItem("activeLink","/dashboard")
        setShowDashBoard(true);
        setShowSettings(false);
        setShowWallets(false);
        setShowCategories(false);
        setShowReportBug(false);
        setShowGiveFeedback(false);
        setShowDrop(false);
    }

    function SettingsClicked(){
        navigate('/settings');
        updateActiveLink('/settings');
        localStorage.setItem("activeLink","/settings")

        setShowSettings(true);
        setShowDashBoard(false);
        setShowWallets(false);
        setShowCategories(false);
        setShowReportBug(false);
        setShowGiveFeedback(false);
        setShowDrop(false);

    }

    function WalletsClicked(){
        // navigate('/wallets');
        if(walletNameArray.length===0){
            setShowAddWallet(true);
        }else{
            setShowAddWallet(false);
        }

        updateActiveLink('/wallets');
        localStorage.setItem("activeLink","/wallets");
        setShowDrop(prev=>!prev)
        // setShowWallets(true);
        // setShowSettings(false);
        // setShowDashBoard(false);
        // setShowCategories(false);
        // setShowReportBug(false);
        // setShowGiveFeedback(false);
    }

    function CategoriesClicked(){
        navigate('/categories');
        updateActiveLink('/categories');
        localStorage.setItem("activeLink","/categories")

        setShowCategories(true);
        setShowWallets(false);
        setShowDashBoard(false);
        setShowSettings(false);
        setShowReportBug(false);
        setShowGiveFeedback(false);
        setShowDrop(false);

    }
    
    function GiveFeedbackClicked(){
        navigate('/give-feedback');
        updateActiveLink('/give-feedback');
        localStorage.setItem("activeLink","/give-feedback")

        setShowCategories(false);
        setShowReportBug(false);
        setShowGiveFeedback(true);
        setShowWallets(false);
        setShowDashBoard(false);
        setShowSettings(false);
        setShowDrop(false);

    }

    function ReportBugClicked(){
        navigate('/report-bug');
        updateActiveLink('/report-bug');
        localStorage.setItem("activeLink","/report-bug")

        setShowCategories(false);
        setShowReportBug(true);
        setShowGiveFeedback(false);
        setShowWallets(false);
        setShowDashBoard(false);
        setShowSettings(false);
        setShowDrop(false);

    }

    async function WalletData(uid){
        try {
            const q = query(collection(db,'wallets'),where('uid','==',uid));
            const unsusbcribe = onSnapshot(q,(snapshot)=>{
                let nameArray = [];
                if(!snapshot.empty){
                    snapshot.docs.map((doc)=>{
                        const item = doc.data()
                        nameArray.push(item);
                    })
                    setWalletNameArray(nameArray);
                    // console.log(nameArray);
                }

            })
            return ()=>unsusbcribe();
        } catch (error) {
            console.log("Error occured : ",error);
        }
    }

    return(
        <div className="menu--div">
            <div className="logo--div">
                <p className="logo">MONOUT</p>
            </div>
            <div className="links">
                <div className="link--div" style={styler==='/dashboard' ? styleWhenLinkIsClicked:null} onClick={()=>DashBoardClicked()}>
                    <i class='bx bxs-dashboard bx-rotate-180' id="dashboard--icon" ></i>
                    <p className="dashboard">Dashboard</p>
                </div>
                <div className="link--div" style={styler==='/wallets' ? styleWhenLinkIsClicked:null} onClick={()=>WalletsClicked()}>
                    <i class='bx bx-wallet' id="dashboard--icon" ></i>
                    <p className="dashboard">Wallets</p>
                </div>
                    {showDrop && walletNameArray.length>0 && <div className="allWallets">
                        {walletNameArray.length>0 ?(
                            walletNameArray.map((item)=>(
                                <Link to={`/wallets/${item.id}`} className="link--drop">
                                    <div className="wallet">
                                        <i class='bx bx-subdirectory-right' id="down-right"></i>
                                        <p>{item.name}</p>
                                    </div>
                                </Link>
                            ))
                            )
                            :
                            (<></>)
                        }                        
                    </div>}     
                <div className="link--div" style={styler==='/categories' ? styleWhenLinkIsClicked:null} onClick={()=>CategoriesClicked()}>
                    <i class='bx bx-folder' id="dashboard--icon" ></i>
                    <p className="dashboard">Categories</p>
                </div>
                <div className="link--div" style={styler==='/settings' ? styleWhenLinkIsClicked:null} onClick={()=>SettingsClicked()}>
                    <i class='bx bx-cog' id="dashboard--icon"  ></i>
                    <p className="dashboard">Settings</p>
                </div>
            </div>
            <div className="bottom--links">
                <div className="link--div" style={styler==='/give-feedback' ? styleWhenLinkIsClicked:null} onClick={()=>GiveFeedbackClicked()}>
                    <i class='bx bx-comment-dots' id="dashboard--icon" ></i>
                    <p className="dashboard">Give Feedback</p>
                </div>
                <div className="link--div" style={styler==='/report-bug' ? styleWhenLinkIsClicked:null} onClick={()=>ReportBugClicked()}>
                    <i class='bx bx-bug' id="dashboard--icon" ></i>
                    <p className="dashboard">Report Bug</p>
                </div>
            </div>  
        </div>
    )
}