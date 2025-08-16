import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "npm install mongoose-aggregate-paginate-v2"

const videoSchema = new Schema(
    {
        id: {
            type: String,
            required: true,
        },
        videoFile: {
            type: String,
            required: true,
            size: number
        },
        thumbnail: {
            type: String,
            required: true
        },
        title:{
            type: String, //cloudinary url
            required: true
        },
        description: {
            type: String,  //cloudinary url
            required: true
        }, 
        duration: {
            type: Number,
            required: true
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true
        }, 
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timeStamps: true
    }
)


mongoose.plugin(mongooseAggregatePaginate)


export const Video = mongoose.model("Video", videoSchema)