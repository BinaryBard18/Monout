import React,{useContext} from 'react';
import '../ReportBug.css';
import { Box, TextField, MenuItem } from "@mui/material";
import AppContext from '../context/AppContext';

export default function ReportBug() {
  
    const {typeOfIssue,
      setTypeOfIssue,
      priority,
      setPriority,
      charactersLeft,
      setCharactersLeft} = useContext(AppContext)

    const handleKeyStrokes=(event)=>{
        const len = event.target.value.length
        setCharactersLeft(1000-len)
    }
    
    const handleChangeCategory =(event)=>{
        setTypeOfIssue(event.target.value);
    }

    const handleChangePriority =(event)=>{
        setPriority(event.target.value);
    }
  return (
    <div className="report--bug--div">
      <div className='report--bug--child'>
        <p className='report--bug--title'>Report Bug</p>
        <p className='report-bug--description'>What do you want to report</p>
      </div>
      <div className='reporting--bug'>
        <p className='issue--category'>What issue you want to report ?<span> *</span></p>
        <Box width="40vw" className="textField--icon--container" >
          <TextField 
            select 
            value={typeOfIssue}
            placeholder='hello' 
            onChange={handleChangeCategory} 
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                      borderColor: 'grey',
                  },
                  '&:hover fieldset': {
                      borderColor: 'none',
                  },
                  '&.Mui-focused fieldset': {
                      borderColor: 'transparent',
                  },
              },
              '& .MuiOutlinedInput-input': {
                  color: 'whitesmoke',
                  padding: '15px !important',
                  fontSize:'0.9rem',
              },
              '& .MuiSelect-icon': {
                  color: 'white',
              },
              '& .Mui-focused': {
                  outline: 'none',
              }
            }}
            InputProps={{
                style: {
                    color: 'white',
                    border: '1px solid grey',
                    textIndent:'10px',
                    outline: 'none', // Remove default outline
                },
            }}
          >
            <MenuItem value='performance'>Performance Bugs</MenuItem>
            <MenuItem value='security'>Security Bugs</MenuItem>
            <MenuItem value='ui/ux'>UI/UX Bugs</MenuItem>
            <MenuItem value='calcualtion'>Calculation and Analytics Bugs</MenuItem>
            <MenuItem value='integration'>Integration and Localization Bugs</MenuItem>
          </TextField>
          {/* <i class='bx bx-expand-vertical' id='up--down' ></i> */}
        </Box>
      </div>
      <div className='email--input--div'>
        <p className='email--input--title'>Email Id<span> *</span></p>
        <input type="email" className='email--input' placeholder='for eg. abc@gmail.com'></input>
      </div>
      <div className='brief--description--div'>
            <p className='brief--description--title'>A brief Description of the problem<span> *</span></p>
            <textarea 
                className='describe--the--issue' 
                minLength="20"
                maxLength="1000" 
                placeholder='Describe your issue'
                onChange={handleKeyStrokes}
            ></textarea>
            <div className='characters--left--div'>
                <p className='characters--left'>You have {charactersLeft} left</p>
            </div>
      </div>
      <div className='priority--div'>
            <p className='priority--description--title'>Prioritize the issue<span> *</span></p>
            <Box width="40vw" className="textField--icon--container">
          <TextField 
            select 
            value={priority}
            placeholder='hello' 
            onChange={handleChangePriority} 
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                      borderColor: 'grey',
                  },
                  '&:hover fieldset': {
                      borderColor: 'none',
                  },
                  '&.Mui-focused fieldset': {
                      borderColor: 'transparent',
                  },
              },
              '& .MuiOutlinedInput-input': {
                  color: 'whitesmoke',
                  padding: '15px !important',
                  fontSize:'0.9rem',
              },
              '& .MuiSelect-icon': {
                  color: 'white',
              },
              '& .Mui-focused': {
                  outline: 'none',
              }
            }}
            InputProps={{
                style: {
                    color: 'white',
                    border: '1px solid grey',
                    textIndent:'10px',
                    outline: 'none', // Remove default outline
                },
            }}
          >
            <MenuItem value='critical'>Critical Bug</MenuItem>
            <MenuItem value='major'>Major Bug</MenuItem>
            <MenuItem value='minor'>Minor Bug</MenuItem>
          </TextField>
          {/* <i class='bx bx-expand-vertical' id='up--down' ></i> */}
        </Box>
      </div>
      <div className='button--div'> 
            <button className='submit--button' type='button'>Report Error</button>
      </div>
    </div>
  );
}
