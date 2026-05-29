import mongoose from 'mongoose';

const escrowSchema = new mongoose.Schema({
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['held', 'released_to_freelancer', 'refunded_to_client', 'disputed'], 
        default: 'held' 
    },
    paymentVoucherUrl: { type: String, required: true } // Screenshot proof of EasyPaisa transfer
}, { timestamps: true });

export default mongoose.model('Escrow', escrowSchema);