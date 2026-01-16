import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const ProtectedRoute = ({children, allowedRoles = ['student', 'recruiter', 'admin']}) => {
    const {user} = useSelector(store=>store.auth);

    const navigate = useNavigate();

    useEffect(()=>{
        if(user === null || !allowedRoles.includes(user.role)){
            navigate("/");
        }
    },[user, navigate, allowedRoles]);

    return (
        <>
        {children}
        </>
    )
};
export default ProtectedRoute;