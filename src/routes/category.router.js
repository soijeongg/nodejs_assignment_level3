import express from 'express';
const router = express.Router();
import { PrismaClient } from '@prisma/client';
import { prisma } from '../utils/index.js';
import Joi from "joi"

const schema = Joi.object({
  name: Joi.string().required(), 
  order: Joi.number().integer().required(), 
});
//카테고리 전체 조회
router.get('/', async (req, res) => {
    
  let category = await prisma.Categories.findMany({
    select: {
      categoryId: true,
      name: true,
      order: true,
    },
    orderBy: {
      order: 'asc',
    },
  });
return res.status(200).json({data:category})
});

router.post('/', async(req, res)=> {
    try{
    if(! req.body){
        return res.status(404),json({errorMessage:"데이터 형식이 올바르지 않습니다"})
    }
    let {name} = req.body
    const lastCategory = await prisma.Categories.findFirst({
      orderBy: { order: 'desc' }, // 순서대로 정렬하여 가장 마지막 카테고리를 가져옵니다.
    });
     const order = lastCategory ? lastCategory.order + 1 : 1;
    let category = await prisma.Categories.create({
      data: {
        name,
        order,
      },
    });
    return res.status(200).json({message:"카테고리를 등록하였습니다"})
    }catch(error){
        next(error)
    }
})

router.put('/:categoryId', async (req, res, next) => {
try{
  let { categoryId } = req.params;
  const { name, order } = req.body;
  if (!req.params) {
    return res
      .status(404)
      .json({ message: '데이터 형식이 올바르지 않습니다.' });
  }
const validationResult = schema.validate({ name, order });
  let categoryfind = await prisma.Categories.findFirst({
    where: { categoryId: +categoryId },
  });
  if (!categoryfind) {
    return res.status(404).json({ message: '존재하지 않는 카테고리입니다' });
  }
  await prisma.Categories.update({
    data: { name, order },
    where: {
      categoryId: +categoryId,
    },
  });
  return res.status(200).json({ message: '카테고리 정보를 수정하였습니다' });
}catch(error){
    next(error)
}
});

router.delete('/:categoryId', async (req, res,next) => {
    try{
  let { categoryId } = req.params;
  if (!req.params) {
    return res
      .status(404)
      .json({ message: '데이터 형식이 올바르지 않습니다.' });
  }
  await prisma.Menus.deleteMany({
    where: {
      categoryId: +categoryId,
    },
  });
  let deleteOne = await prisma.Categories.delete({
    where: { categoryId: +categoryId },
  });
  if (!deleteOne) {
    return res.status(404).json({ message: '존재하지 않는 카테고리입니다' });
  }

  return res.status(200).json({ message: '카테고리 정보를 삭제하였습니다.' });
}catch(error){
    next(error)
}
});

export default router;