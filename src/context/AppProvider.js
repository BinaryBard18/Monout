import React,{useState} from "react";
import AppContext from "./AppContext";

const AppProvider = ({children})=>{
    const [showDashboard,setShowDashBoard] = useState(true);
    const [showSettings,setShowSettings] = useState(false);
    const [showWallets,setShowWallets] = useState(false);
    const [showCatogories,setShowCategories] = useState(false);
    const [showGiveFeeback,setShowGiveFeedback] = useState(false);
    const [showReportBug,setShowReportBug] = useState(false);

    const [showTransaction,setShowTransaction] = useState(true);
    const [showAnalysis,setShowAnalysis] = useState(false);
    const [showPreferences,setShowPreferences] = useState(false);
    
    const [showLimitsModal,setShowLimitsModal] = useState(false);
    const [showSubscriptionModal,setShowSubscriptionModal] = useState(false);
    const [showAddTransactionModal,setShowAddTransactionModal] = useState(false);
    const [showIncome,setShowIncome] = useState(false);
    const [showExpense,setShowExpense] = useState(false);
    const [showTransfer,setShowTransfer] = useState(false);
    
    const [typeOfIssue,setTypeOfIssue] = useState('performance')
    const [priority,setPriority] = useState('major')
    const [charactersLeft,setCharactersLeft] = useState(1000);
    const [showDetails,setShowDetails] = useState(false);
    const [showConfirmSubscriptionTransfer,setShowConfirmSubscriptionTransfer] = useState(false);
    const [showAddWallet,setShowAddWallet] = useState(false);
    const [showAddCategoryModal,setShowAddCategoryModal] = useState(false);
    const [showDeleteWalletConfirmation,setShowDeleteWalletConfirmation] = useState(false);
    const [nameOfUser,setNameOfUser] = useState('');
    const [imageURL,setImageURL] = useState('');
    const [styler,setStyler] = useState(''); 
    const [showDropDown,setShowDropDown] = useState(false);
    const [showLandingModal,setShowLandingModal]=useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState(null);
    const [uid,setUid] = useState(null);
    const [salary,setSalary] = useState(1);
    const [greet,setGreet] = useState(false);// Assuming user is already registered to my platform


    const [days,setDays] = useState(1);

    const value={
        showDashboard,
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
        showTransaction,
        setShowTransaction,
        showAnalysis,
        setShowAnalysis,
        showPreferences,
        setShowPreferences,
        showDetails,
        setShowDetails,
        days,
        setDays,
        showLimitsModal,
        setShowLimitsModal,
        typeOfIssue,
        setTypeOfIssue,
        priority,
        setPriority,
        charactersLeft,
        setCharactersLeft,
        showSubscriptionModal,
        setShowSubscriptionModal,
        showDropDown,
        setShowDropDown,
        showAddTransactionModal,
        setShowAddTransactionModal,
        showIncome,
        setShowIncome,
        showExpense,
        setShowExpense,
        showTransfer,
        setShowTransfer,
        showConfirmSubscriptionTransfer,
        setShowConfirmSubscriptionTransfer,
        showAddWallet,
        setShowAddWallet,
        showAddCategoryModal,
        setShowAddCategoryModal,
        showDeleteWalletConfirmation,
        setShowDeleteWalletConfirmation,
        nameOfUser,
        setNameOfUser,
        imageURL,
        setImageURL,
        styler,
        setStyler,
        showLandingModal,
        setShowLandingModal,
        selectedCurrency, 
        setSelectedCurrency,
        uid,
        setUid,
        salary,
        setSalary,
        greet,
        setGreet
    }; 

    return(
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )

}

export default AppProvider;