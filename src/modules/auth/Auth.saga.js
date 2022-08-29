import { all, put, take, call, delay, fork, spawn, cancel, race } from "redux-saga/effects";
import { registerUser, loginUser, logoutUser } from "../../utils/api";
import {
	authFail,
	authSuccess,
	AUTH_START,
	logoutFail,
	logoutSuccess,
	LOGOUT_START,
} from "./Auth.actions";

/* function* authenticate({ email, password, isRegister }) {
	try {
		let data;
		if (isRegister) {
			data = yield call(registerUser, { email, password });
		} else {
			data = yield call(loginUser, { email, password });
		}
		yield put(authSuccess(data.user));
		return data.user.uid;
	} catch (error) {
		yield put(authFail(error.message));
	}
} */

function* authenticate({ email, password, isRegister }) {
  try {
    if (isRegister) {
    }else{
      //RACE. el primero que termine se va a ejecutar
      const {data, timeout} = yield race({
        data: call(loginUser, {email, password}),
        timeout: delay(1000)
      })
      
      if(data){
        yield put(authSuccess(data.user))
        return data.user.uid
      }else/* timeout termina primero */{
        yield put(authFail('The login didnt finished in the accepted time'))
      }
    }
	} catch (error) {
		yield put(authFail(error.message));
	}
}

function* authFlow() {
  while (true) {
    const action = yield take(AUTH_START);
		const userId = yield call(authenticate, action.payload);
		//fork => va a hacer en paralelo, sin bloquear
    const forkedSaga = yield fork(longRunningYield)
    //Si un error se lanza antes, el resto del flow NO sigue. Para eso en vez de fork usamos spawn
    //yield fork(throwErrorSaga)
    //yield spawn(throwErrorSaga) <-- asi
    if (userId) {
			yield take(LOGOUT_START);
      yield call(logout)
        //Si queremos cancelar el envio de data cuando me deslogueo por ejemplo (y no esperar los 5 segundos)
      yield cancel(forkedSaga)
		}
	}
}

function* longRunningYield(){
  yield delay(2000)
  yield console.log('Hi!')
}

function* throwErrorSaga(){
  yield delay(1000)
  yield call(()=> {throw Error('New error from saga')})
}

function* logout() {
  try {
    yield call(logoutUser)
    yield put(logoutSuccess())
  } catch (error) {
    yield put(logoutFail(error.message))
  }
  console.log('logout')
}



export default function* () {
	yield all([authFlow()]);
}