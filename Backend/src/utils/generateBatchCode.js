export const generateBatchCode=(crop)=>{
        const rand =Math.floor(100000+Math.random()*900000);
        return `AGRI-${crop.toUpperCase()}-${rand}`;
}