class apiError extends Error{
    constructor(
        statusCode,
        message = "Something went wrong",
        error = [],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null 
        this.message = false
        this.errors = this.errors

        if(stack){
            this.stack = stack
        }
        else{
            Error.captureStackTree(this,this,constructor)
        }
    }
}


export {apiError}