import express from 'express';
const router = express.Router();
import { prisma } from '../utils/index.js';
import Joi from 'joi';
//put/:categoryId 를 위한 schema
const schema = Joi.object({
  name: Joi.string().required(),
  order: Joi.number().integer().required(),
});
//post/:categoryId 를 위한 schema
const schemas = Joi.object({
  name: Joi.string().required(),
});
//delete/:categoryId 를 위한 schema
const idSchemas = Joi.object({
  categoryId: Joi.number().integer().required(),
});
//카테고리 전체 조회
router.get('/', async (req, res, next) => {
  try {
    let category = await prisma.categories.findMany({
      select: {
        categoryId: true,
        name: true,
        order: true,
      },
      orderBy: {
        order: 'asc',
      },
    });
    return res.status(200).json({ data: category });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    //없으면
    let { name } = req.body;
    const validationResult = schemas.validate({ name });
    if (validationResult.error) {
      error.status = 400;
      throw new Error('데이터 형식이 올바르지 않습니다.');
    }
    const lastCategory = await prisma.categories.findFirst({
      orderBy: { order: 'desc' },
    });
    const order = lastCategory ? lastCategory.order + 1 : 1;
    await prisma.categories.create({
      data: {
        name,
        order,
      },
    });
    return res.status(200).json({ message: '카테고리를 등록하였습니다' });
  } catch (error) {
    next(error);
  }
});

router.put('/:categoryId', async (req, res, next) => {
  try {
    let { categoryId } = req.params;
    const { name, order } = req.body;
    const validationResult = schema.validate({ name, order });
    if (validationResult.error) {
      error.status = 404;
      throw new Error('데이터 형식이 올바르지 않습니다.');
    }
    let categoryfind = await prisma.categories.findFirst({
      where: { categoryId: +categoryId },
    });
    if (!categoryfind) {
      error.status = 404;
      throw new Error('존재하지 않는 카테고리입니다.');
    }
    await prisma.categories.update({
      data: { name, order },
      where: {
        categoryId: +categoryId,
      },
    });
    return res.status(200).json({ message: '카테고리 정보를 수정하였습니다' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:categoryId', async (req, res, next) => {
  try {
    let { categoryId } = req.params;
    const validationResults = idSchemas.validate({ categoryId });
    if (validationResults.error) {
      error.status = 404;
      throw new Error('데이터 형식이 올바르지 않습니다.');
    }
    let categoryfind = await prisma.Categories.findFirst({
      where: { categoryId: +categoryId },
    });
    if (!categoryfind) {
      error.status = 404;
      throw new Error('존재하지 않는 카테고리입니다.');
    }
    let deleteOne = await prisma.Categories.delete({
      where: { categoryId: +categoryId },
    });
    if (!deleteOne) {
      error.status = 404;
      throw new Error('삭제에 실패했습니다.');
    }
    return res.status(200).json({ message: '카테고리 정보를 삭제하였습니다.' });
  } catch (error) {
    next(error);
  }
});

export default router;
