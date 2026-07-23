import { connectorConfig } from '@dataconnect/ecommerce-template'
import { initializeApp, getApps } from 'firebase/app'
import { getDataConnect } from 'firebase/data-connect'
import { firebaseConfig } from '../firebase'

const firebase_app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const dc = getDataConnect(firebase_app, connectorConfig)
