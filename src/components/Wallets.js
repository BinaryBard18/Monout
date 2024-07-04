import React,{useContext,useEffect} from 'react';
import '../Wallets.css';
import WalletsRightPart from './WalletsRightPart';
import TransactionHistory from './TransactionHistory';
import Analysis from './Analysis';
import Preferences from "./Preferences"
import HeadOfWallet from "./HeadOfWallet"
import AppContext from '../context/AppContext';

export default function Wallets() {

  const {showTransaction,
    setShowTransaction,
    showAnalysis,
    setShowAnalysis,
    showPreferences,
    setShowPreferences,
    uid,
    setUid
  } = useContext(AppContext)

  const styleTheBackground = {
    color:'whitesmoke',
    backgroundColor:'#222222',
    borderRadius:'50%'
  }

  function OpenTransactionHistory(){
    setShowTransaction(true);
    setShowAnalysis(false);
    setShowPreferences(false);
    console.log("transactionHist")
  }

  function OpenAnalysis(){
      setShowTransaction(false);
      setShowAnalysis(true);
      setShowPreferences(false);
      console.log("analysisOpened")
  }

  function OpenPreferences(){
      setShowTransaction(false);
      setShowAnalysis(false);
      setShowPreferences(true);
      console.log("PrefOpened")
  }


  return (
    <div className="wallets--div">
      <div className='wallets--first--div'>
      <HeadOfWallet
        OpenTransactionHistory={OpenTransactionHistory}
        OpenAnalysis={OpenAnalysis}
        OpenPreferences={OpenPreferences}
        styleTheBackground={styleTheBackground}
      />
      <div className='one--of--page'>
      {showTransaction && <TransactionHistory
        OpenTransactionHistory={OpenTransactionHistory}
        OpenAnalysis={OpenAnalysis}
        OpenPreferences={OpenPreferences}
        styleTheBackground={styleTheBackground}
      />}

      {showAnalysis && <Analysis
        OpenTransactionHistory={OpenTransactionHistory}
        OpenAnalysis={OpenAnalysis}
        OpenPreferences={OpenPreferences}
        styleTheBackground={styleTheBackground}
      />}

      {showPreferences && <Preferences
        OpenTransactionHistory={OpenTransactionHistory}
        OpenAnalysis={OpenAnalysis}
        OpenPreferences={OpenPreferences}
        styleTheBackground={styleTheBackground}
      />}
      </div>
      </div>

      <div className='next--parent--div' style={{ overflowY: 'auto', height: '100vh' }}>
        <WalletsRightPart/>
      </div>
    </div>
  );
}
