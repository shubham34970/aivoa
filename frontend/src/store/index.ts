import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import complaintReducer from './complaintSlice'
import copilotReducer from './copilotSlice'

export const store = configureStore({
  reducer: {
    complaint: complaintReducer,
    copilot: copilotReducer
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
