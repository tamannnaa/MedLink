
const isAuthenticated=(req,res,next)=>{
    if(req.session.isAuthenticated){
        return next();
    }
    res.redirect("/");
}

const isDoctor=(req,res,next)=>{
    if(req.session.isAuthenticated&&req.session.role=="doctor"){
        return next();
    }
    res.redirect("/");
}

const isPatient=(req,res,next)=>{
    if(req.session.isAuthenticated&&req.session.role=="patient"){
        return next();
    }
    res.redirect("/");
}

const isAdmin=(req,res,next)=>{
    if(req.session.isAuthenticated&&req.session.role=="admin"){
        return next();
    }
    res.redirect("/");
}

module.exports={isAuthenticated,isAdmin,isDoctor,isPatient}